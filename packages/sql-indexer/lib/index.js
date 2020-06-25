const { RPC, Reader, validators } = require("ckb-js-toolkit");

const SCRIPT_TYPE_LOCK = 0;
const SCRIPT_TYPE_TYPE = 1;

const IO_TYPE_INPUT = 0;
const IO_TYPE_OUTPUT = 1;

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

function hexToDbBigInt(hex) {
  return BigInt(hex).toString();
}

function dbBigIntToHex(i) {
  return "0x" + BigInt(i).toString(16);
}

function nodeBufferToHex(b) {
  return new Reader(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  ).serializeJson();
}

function hexToNodeBuffer(b) {
  return Buffer.from(new Reader(b).toArrayBuffer());
}

function dbItemToScript(item) {
  return {
    code_hash: nodeBufferToHex(item.code_hash),
    hash_type: item.hash_type === 1 ? "type" : "data",
    args: nodeBufferToHex(item.args),
  };
}

async function locateScript(knex, id) {
  const data = await knex("scripts").where("id", id);
  if (data.length === 0) {
    throw new Error("Script cannot be found!");
  }
  return dbItemToScript(data[0]);
}

async function ensureScriptInserted(trx, script, hasReturning) {
  const data = {
    code_hash: hexToNodeBuffer(script.code_hash),
    hash_type: script.hash_type === "type" ? 1 : 0,
    args: hexToNodeBuffer(script.args),
  };
  let ids = await trx("scripts").where(data).select("id");
  if (ids.length === 0) {
    ids = await trx("scripts").insert([data], hasReturning ? ["id"] : null);
  }
  if (ids.length === 0) {
    throw new Error("Insertion failure!");
  }
  let id = ids[0];
  if (id instanceof Object) {
    id = id.id;
  }
  return id;
}

class Indexer {
  constructor(
    uri,
    knex,
    {
      pollIntervalSeconds = 2,
      livenessCheckIntervalSeconds = 5,
      logger = defaultLogger,
      keepNum = 10000,
      pruneInterval = 2000,
    } = {}
  ) {
    this.rpc = new RPC(uri);
    this.knex = knex;
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.livenessCheckIntervalSeconds = livenessCheckIntervalSeconds;
    this.logger = logger;
    this.isRunning = false;
    this.keepNum = keepNum;
    this.pruneInterval = pruneInterval;
  }

  _hasReturning() {
    return this.knex.client.config.client === "postgresql";
  }

  running() {
    return this.isRunning;
  }

  startForever() {
    this.start();
    setInterval(() => {
      if (!this.running()) {
        this.logger(
          "error",
          "Native indexer has stopped, maybe check the log?"
        );
        this.start();
      }
    }, this.livenessCheckIntervalSeconds * 1000);
  }

  start() {
    this.isRunning = true;
    this.scheduleLoop();
  }

  stop() {
    this.isRunning = false;
  }

  scheduleLoop(timeout = 1) {
    setTimeout(() => {
      this.loop();
    }, timeout);
  }

  loop() {
    if (!this.running()) {
      return;
    }
    this.poll()
      .then((timeout) => {
        this.scheduleLoop(timeout);
      })
      .catch((e) => {
        this.logger(
          "error",
          `Error occurs: ${e} ${e.stack}, stopping indexer!`
        );
        this.stop();
      });
  }

  async poll() {
    let timeout = 1;
    const tip = await this.tip();
    if (tip) {
      const { block_number, block_hash } = tip;
      const nextBlockNumber = BigInt(block_number) + BigInt(1);
      const block = await this.rpc.get_block_by_number(
        dbBigIntToHex(nextBlockNumber)
      );
      if (block) {
        if (block.header.parent_hash === block_hash) {
          await this.append(block);
        } else {
          await this.rollback();
        }
      } else {
        timeout = this.pollIntervalSeconds * 1000;
      }
    } else {
      const block = await this.rpc.get_block_by_number(dbBigIntToHex(0));
      await this.append(block);
    }
    return timeout;
  }

  async tip() {
    const data = await this.knex
      .select("block_number", "block_hash")
      .table("block_digests")
      .orderBy("block_number", "desc")
      .limit(1);
    if (data.length > 0) {
      return {
        block_number: dbBigIntToHex(data[0].block_number),
        block_hash: nodeBufferToHex(data[0].block_hash),
      };
    }
    return null;
  }

  async append(block) {
    await this.knex.transaction(async (trx) => {
      const blockNumber = hexToDbBigInt(block.header.number);
      await trx("block_digests").insert({
        block_number: blockNumber,
        block_hash: hexToNodeBuffer(block.header.hash),
      });

      for (const [txIndex, tx] of block.transactions.entries()) {
        let txId = (
          await trx("transaction_digests").insert(
            {
              tx_hash: hexToNodeBuffer(tx.hash),
              tx_index: txIndex,
              output_count: tx.outputs.length,
              block_number: blockNumber,
            },
            this._hasReturning() ? ["id"] : null
          )
        )[0];
        if (txId instanceof Object) {
          txId = txId.id;
        }
        // Skip cellbase inputs
        if (txIndex > 0) {
          for (const [inputIndex, input] of tx.inputs.entries()) {
            const data = await trx("cells")
              .where({
                tx_hash: hexToNodeBuffer(input.previous_output.tx_hash),
                index: hexToDbBigInt(input.previous_output.index),
              })
              .select("id", "lock_script_id", "type_script_id");
            for (const { id, lock_script_id, type_script_id } of data) {
              await trx("cells").where("id", id).update({ consumed: true });
              await trx("transactions_scripts").insert({
                script_type: SCRIPT_TYPE_LOCK,
                io_type: IO_TYPE_INPUT,
                index: inputIndex,
                transaction_digest_id: txId,
                script_id: lock_script_id,
              });
              if (type_script_id) {
                await trx("transactions_scripts").insert({
                  script_type: SCRIPT_TYPE_TYPE,
                  io_type: IO_TYPE_INPUT,
                  index: inputIndex,
                  transaction_digest_id: txId,
                  script_id: type_script_id,
                });
              }
            }
          }
        }
        await trx("transaction_inputs").insert(
          tx.inputs.map((input) => {
            return {
              transaction_digest_id: txId,
              previous_tx_hash: hexToNodeBuffer(input.previous_output.tx_hash),
              previous_index: hexToDbBigInt(input.previous_output.index),
            };
          })
        );
        for (const [outputIndex, output] of tx.outputs.entries()) {
          const outputData = tx.outputs_data[outputIndex];
          const lockScriptId = await ensureScriptInserted(
            trx,
            output.lock,
            this._hasReturning()
          );
          let typeScriptId = null;
          if (output.type) {
            typeScriptId = await ensureScriptInserted(
              trx,
              output.type,
              this._hasReturning()
            );
          }
          await trx("cells").insert({
            consumed: false,
            capacity: hexToDbBigInt(output.capacity),
            tx_hash: hexToNodeBuffer(tx.hash),
            index: outputIndex,
            block_number: blockNumber,
            tx_index: txIndex,
            lock_script_id: lockScriptId,
            type_script_id: typeScriptId,
            data: hexToNodeBuffer(outputData),
          });
          await trx("transactions_scripts").insert({
            script_type: SCRIPT_TYPE_LOCK,
            io_type: IO_TYPE_OUTPUT,
            index: outputIndex,
            transaction_digest_id: txId,
            script_id: lockScriptId,
          });
          if (typeScriptId) {
            await trx("transactions_scripts").insert({
              script_type: SCRIPT_TYPE_TYPE,
              io_type: IO_TYPE_OUTPUT,
              index: outputIndex,
              transaction_digest_id: txId,
              script_id: typeScriptId,
            });
          }
        }
      }
    });
    // prune old blocks
    if (
      BigInt(block.header.number) % BigInt(this.pruneInterval) ===
      BigInt(0)
    ) {
      await this.prune();
    }
  }

  async rollback() {
    const tip = await this.tip();
    if (!tip) {
      return;
    }
    const { block_number } = tip;
    const blockNumber = hexToDbBigInt(block_number);
    await this.knex.transaction(async (trx) => {
      const txs = await trx("transaction_digests")
        .where({ block_number: blockNumber })
        .select("id");
      for (const { id } of txs) {
        const inputs = await trx("transaction_inputs")
          .where({ transaction_digest_id: id })
          .select("previous_tx_hash", "previous_index");
        for (const { previous_tx_hash, previous_index } of inputs) {
          await trx("cells")
            .where({
              tx_hash: previous_tx_hash,
              index: previous_index,
            })
            .update({ consumed: false });
        }
        await trx("transaction_inputs")
          .where({ transaction_digest_id: id })
          .del();
        await trx("transactions_scripts")
          .where({ transaction_digest_id: id })
          .del();
      }
      await trx("cells").where({ block_number: blockNumber }).del();
      await trx("block_digests").where({ block_number: blockNumber }).del();
    });
  }

  async prune() {
    const tip = await this.tip();
    if (!tip) {
      return;
    }
    const tipNumber = BigInt(tip.block_number);
    if (tipNumber > BigInt(this.keepNum)) {
      const pruneToBlock = (tipNumber - BigInt(this.keepNum)).toString();
      await this.knex.transaction(async (trx) => {
        await trx("cells")
          .where("consumed", true)
          .andWhere("block_number", "<", pruneToBlock)
          .del();
        await trx("transaction_inputs")
          .whereIn("transaction_digest_id", function () {
            return this.from("transaction_digests")
              .select("id")
              .where("block_number", "<", pruneToBlock);
          })
          .del();
      });
    }
  }

  collector({ lock = null, type = null, argsLen = -1, data = "0x" } = {}) {
    return new CellCollector(this.knex, { lock, type, argsLen, data });
  }
}

class CellCollector {
  constructor(
    knex,
    { lock = null, type = null, argsLen = -1, data = "0x" } = {}
  ) {
    if (!lock && !type) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (lock) {
      validators.ValidateScript(lock);
    }
    if (type && typeof type === "object") {
      validators.ValidateScript(type);
    }
    this.knex = knex;
    this.lock = lock;
    this.type = type;
    this.data = data;
    this.argsLen = argsLen;
  }

  _assembleQuery(order = true) {
    let query = this.knex("cells").where("consumed", false);
    if (order) {
      query = query.orderBy(["cells.block_number", "tx_index", "index"], "asc");
    }
    if (this.lock) {
      const binaryArgs = hexToNodeBuffer(this.lock.args);
      let lockQuery = this.knex("scripts")
        .select("id")
        .where({
          code_hash: hexToNodeBuffer(this.lock.code_hash),
          hash_type: this.lock.hash_type === "type" ? 1 : 0,
        })
        .whereRaw("substring(args, 1, ?) = ?", [
          binaryArgs.byteLength,
          binaryArgs,
        ]);
      if (this.argsLen > 0) {
        lockQuery = lockQuery.whereRaw("length(args) = ?", [this.argsLen]);
      }
      query = query.andWhere(function () {
        return this.whereIn("lock_script_id", lockQuery);
      });
    }
    if (this.type) {
      const binaryArgs = hexToNodeBuffer(this.type.args);
      let typeQuery = this.knex("scripts")
        .select("id")
        .where({
          code_hash: hexToNodeBuffer(this.type.code_hash),
          hash_type: this.type.hash_type === "type" ? 1 : 0,
        })
        .whereRaw("substring(args, 1, ?) = ?", [
          binaryArgs.byteLength,
          binaryArgs,
        ]);
      if (this.argsLen > 0) {
        typeQuery = typeQuery.whereRaw("length(args) = ?", [this.argsLen]);
      }
      query = query.andWhere(function () {
        return this.whereIn("type_script_id", typeQuery);
      });
    }
    if (this.data) {
      query = query.andWhere("data", hexToNodeBuffer(this.data));
    }
    return query;
  }

  async count() {
    return parseInt((await this._assembleQuery(false).count())[0].count);
  }

  async *collect() {
    // TODO: optimize this with streams
    const items = await this._assembleQuery()
      .innerJoin(
        "block_digests",
        "cells.block_number",
        "block_digests.block_number"
      )
      .innerJoin("scripts", "cells.lock_script_id", "scripts.id");
    const foundScripts = {};
    for (const item of items) {
      let type = null;
      // TODO: find a way to join type scripts as well
      if (item.type_script_id) {
        if (!foundScripts[item.type_script_id]) {
          foundScripts[item.type_script_id] = await locateScript(
            this.knex,
            item.type_script_id
          );
        }
        type = foundScripts[item.type_script_id];
      }
      yield {
        cell_output: {
          capacity: dbBigIntToHex(item.capacity),
          lock: dbItemToScript(item),
          type,
        },
        out_point: {
          tx_hash: nodeBufferToHex(item.tx_hash),
          index: dbBigIntToHex(item.index),
        },
        block_hash: nodeBufferToHex(item.block_hash),
        block_number: dbBigIntToHex(item.block_number),
        data: nodeBufferToHex(item.data),
      };
    }
  }
}

module.exports = {
  CellCollector,
  Indexer,
};
