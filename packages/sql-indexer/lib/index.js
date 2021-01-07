const { RPC, Reader, validators } = require("ckb-js-toolkit");
const { EventEmitter } = require("events");
const { utils } = require("@ckb-lumos/base");
const SCRIPT_TYPE_LOCK = 0;
const SCRIPT_TYPE_TYPE = 1;

const IO_TYPE_INPUT = 0;
const IO_TYPE_OUTPUT = 1;

class IndexerEmitter extends EventEmitter {}
IndexerEmitter.prototype.lock = undefined;
IndexerEmitter.prototype.type = undefined;
IndexerEmitter.prototype.outputData = undefined;
IndexerEmitter.prototype.argsLen = undefined;
IndexerEmitter.prototype.fromBlock = undefined;

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

function asyncSleep(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
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

function dbItemToScript(code_hash, hash_type, args) {
  if (code_hash === null) {
    return undefined;
  } else {
    return {
      code_hash: nodeBufferToHex(code_hash),
      hash_type: hash_type === 1 ? "type" : "data",
      args: nodeBufferToHex(args),
    };
  }
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
      emitters = [],
      medianTimeEmitters = [],
    } = {}
  ) {
    this.uri = uri;
    this.rpc = new RPC(uri);
    this.knex = knex;
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.livenessCheckIntervalSeconds = livenessCheckIntervalSeconds;
    this.logger = logger;
    this.isRunning = false;
    this.keepNum = keepNum;
    this.pruneInterval = pruneInterval;
    this.emitters = emitters;
    this.medianTimeEmitters = medianTimeEmitters;
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

  async waitForSync(blockDifference = 3) {
    const rpc = new RPC(this.uri);
    while (true) {
      const tip = await this.tip();
      const indexedNumber = tip ? BigInt(tip.block_number) : 0n;
      const ckbTip = await rpc.get_tip_block_number();

      if (BigInt(ckbTip) - indexedNumber <= BigInt(blockDifference)) {
        break;
      }

      await asyncSleep(1000 * this.pollIntervalSeconds);
    }
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
          await this.publishAppendBlockEvents(block);
        } else {
          await this.publishRollbackEvents();
          await this.rollback();
        }
      } else {
        timeout = this.pollIntervalSeconds * 1000;
      }
    } else {
      const block = await this.rpc.get_block_by_number(dbBigIntToHex(0));
      await this.append(block);
      await this.publishAppendBlockEvents(block);
      await this.checkAndPrune(block);
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
  }

  async checkAndPrune(block) {
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
      await trx("transaction_digests")
        .where({ block_number: blockNumber })
        .del();
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

  async publishAppendBlockEvents(block) {
    for (const [txIndex, tx] of block.transactions.entries()) {
      const blockNumber = hexToDbBigInt(block.header.number);
      // publish changed events if subscribed script exists in previous output cells , skip the cellbase.
      if (txIndex > 0) {
        for (const input of tx.inputs) {
          const [{ lock_script_id, type_script_id, data }] = await this.knex
            .select("lock_script_id", "type_script_id", "data")
            .from("cells")
            .where({
              tx_hash: hexToNodeBuffer(input.previous_output.tx_hash),
              index: hexToDbBigInt(input.previous_output.index),
            });
          const outputData = nodeBufferToHex(data);
          const output = await this.buildOutput(lock_script_id, type_script_id);
          this.filterEvents(output, blockNumber, outputData);
        }
      }
      // publish changed events if subscribed script exists in output cells.
      for (const [outputIndex, output] of tx.outputs.entries()) {
        const outputData = tx.outputs_data[outputIndex];
        this.filterEvents(output, blockNumber, outputData);
      }
    }
    await this.emitMedianTimeEvents();
  }

  async publishRollbackEvents() {
    const tip = await this.tip();
    if (!tip) {
      return;
    }
    const { block_number } = tip;
    const blockNumber = hexToDbBigInt(block_number);

    const cells = await this.knex
      .select("lock_script_id", "type_script_id", "data")
      .from("cells")
      .where({ block_number: blockNumber });
    for (const { lock_script_id, type_script_id, data } of cells) {
      const outputData = nodeBufferToHex(data);
      const output = await this.buildOutput(lock_script_id, type_script_id);
      this.filterEvents(output, blockNumber, outputData);
    }

    const txs = await this.knex
      .select("id", "tx_index")
      .from("transaction_digests")
      .where({ block_number: blockNumber })
      .orderBy("tx_index");
    for (const { id, tx_index } of txs) {
      // publish changed events if subscribed script exists in previous output cells , skip the cellbase.
      if (tx_index > 0) {
        const inputs = await this.knex
          .select("previous_tx_hash", "previous_index")
          .from("transaction_inputs")
          .where({ transaction_digest_id: id });
        for (const { previous_tx_hash, previous_index } of inputs) {
          const cells = await this.knex
            .select("lock_script_id", "type_script_id", "data")
            .from("cells")
            .where({
              tx_hash: previous_tx_hash,
              index: previous_index,
            });
          for (const { lock_script_id, type_script_id, data } of cells) {
            const outputData = nodeBufferToHex(data);
            const output = await this.buildOutput(
              lock_script_id,
              type_script_id
            );
            this.filterEvents(output, blockNumber, outputData);
          }
        }
      }
    }

    await this.emitMedianTimeEvents();
  }

  async buildOutput(lock_script_id, type_script_id) {
    const [{ code_hash, hash_type, args }] = await this.knex
      .select("*")
      .from("scripts")
      .where({ id: lock_script_id });
    let output = {
      lock: {
        code_hash: nodeBufferToHex(code_hash),
        args: nodeBufferToHex(args),
        hash_type: hash_type === 0 ? "data" : "type",
      },
      type: null,
    };
    if (type_script_id !== null) {
      const [{ code_hash, hash_type, args }] = await this.knex
        .select("*")
        .from("scripts")
        .where({ id: type_script_id });
      output.type = {
        code_hash: nodeBufferToHex(code_hash),
        args: nodeBufferToHex(args),
        hash_type: hash_type === 0 ? "data" : "type",
      };
    }
    return output;
  }

  filterEvents(output, blockNumber, outputData) {
    for (const emitter of this.emitters) {
      if (
        emitter.lock !== undefined &&
        this.checkFilterOptions(
          emitter,
          blockNumber,
          outputData,
          emitter.lock,
          output.lock
        )
      ) {
        emitter.emit("changed");
      }
    }
    if (output.type !== null) {
      for (const emitter of this.emitters) {
        if (
          emitter.type !== undefined &&
          this.checkFilterOptions(
            emitter,
            blockNumber,
            outputData,
            emitter.type,
            output.type
          )
        ) {
          emitter.emit("changed");
        }
      }
    }
  }

  async emitMedianTimeEvents() {
    const info = await this.rpc.get_blockchain_info();
    const medianTime = info.median_time;
    for (const medianTimeEmitter of this.medianTimeEmitters) {
      medianTimeEmitter.emit("changed", medianTime);
    }
  }

  checkFilterOptions(emitter, blockNumber, outputData, emitterScript, script) {
    const checkBlockNumber = emitter.fromBlock <= blockNumber;
    const checkOutputData =
      emitter.outputData === "any" ? true : emitter.outputData === outputData;
    const checkScript =
      emitterScript.code_hash === script.code_hash &&
      emitterScript.hash_type === script.hash_type &&
      this.checkArgs(emitter.argsLen, emitterScript.args, script.args);
    return checkBlockNumber && checkOutputData && checkScript;
  }

  checkArgs(argsLen, emitterArgs, args) {
    if (argsLen === -1) {
      return emitterArgs === args;
    } else if (typeof argsLen === "number" && args.length === argsLen * 2 + 2) {
      return args.substring(0, emitterArgs.length) === emitterArgs;
    } else if (argsLen === "any") {
      return args.substring(0, emitterArgs.length) === emitterArgs;
    } else {
      return false;
    }
  }

  collector({ lock = null, type = null, argsLen = -1, data = "any" } = {}) {
    return new CellCollector(this.knex, { lock, type, argsLen, data });
  }

  subscribe({
    lock = null,
    type = null,
    argsLen = -1,
    data = "any",
    fromBlock = null,
    toBlock = null,
    skip = null,
  } = {}) {
    if (lock && type) {
      throw new Error(
        "The notification machanism only supports you subscribing for one script once so far!"
      );
    }
    if (toBlock !== null || skip !== null) {
      this.logger(
        "warn",
        "The passing fields such as toBlock and skip are ignored in subscribe() method."
      );
    }
    let emitter = new IndexerEmitter();
    emitter.argsLen = argsLen;
    emitter.outputData = data;
    if (fromBlock) {
      utils.assertHexadecimal("fromBlock", fromBlock);
    }
    emitter.fromBlock = fromBlock === null ? 0n : BigInt(fromBlock);
    if (lock) {
      validators.ValidateScript(lock);
      emitter.lock = lock;
    } else if (type) {
      validators.ValidateScript(type);
      emitter.type = type;
    } else {
      throw new Error("Either lock or type script must be provided!");
    }
    this.emitters.push(emitter);
    return emitter;
  }

  subscribeMedianTime() {
    const medianTimeEmitter = new EventEmitter();
    this.medianTimeEmitters.push(medianTimeEmitter);
    return medianTimeEmitter;
  }
}

class CellCollector {
  constructor(
    knex,
    {
      lock = null,
      type = null,
      argsLen = -1,
      data = "any",
      fromBlock = null,
      toBlock = null,
      skip = null,
      order = "asc",
    } = {}
  ) {
    if (!lock && (!type || type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }
    // Wrap the plain `Script` into `ScriptWrapper`.
    if (lock && !lock.script) {
      validators.ValidateScript(lock);
      this.lock = { script: lock, argsLen: argsLen };
    } else if (lock && lock.script) {
      validators.ValidateScript(lock.script);
      this.lock = lock;
      // check argsLen
      if (!lock.argsLen) {
        this.lock.argsLen = argsLen;
      }
    }
    if (type === "empty") {
      this.type = type;
    } else if (type && typeof type === "object" && !type.script) {
      validators.ValidateScript(type);
      this.type = { script: type, argsLen: argsLen };
    } else if (type && typeof type === "object" && type.script) {
      validators.ValidateScript(type.script);
      this.type = type;
      // check argsLen
      if (!type.argsLen) {
        this.type.argsLen = argsLen;
      }
    }
    if (fromBlock) {
      utils.assertHexadecimal("fromBlock", fromBlock);
    }
    if (toBlock) {
      utils.assertHexadecimal("toBlock", toBlock);
    }
    if (order !== "asc" && order !== "desc") {
      throw new Error("Order must be either asc or desc!");
    }
    this.knex = knex;
    this.data = data;
    this.argsLen = argsLen;
    this.fromBlock = fromBlock === null ? null : BigInt(fromBlock);
    this.toBlock = toBlock === null ? null : BigInt(toBlock);
    this.skip = skip;
    this.order = order;
  }

  _assembleQuery(order = true) {
    let query = this.knex("cells").where("consumed", false);
    if (order) {
      query = query.orderBy([
        { column: "cells.block_number", order: this.order },
        { column: "cells.tx_index", order: this.order },
        { column: "cells.index", order: this.order },
      ]);
    }
    if (this.fromBlock) {
      query = query.andWhere("cells.block_number", ">=", this.fromBlock);
    }
    if (this.toBlock) {
      query = query.andWhere("cells.block_number", "<=", this.toBlock);
    }
    if (this.lock) {
      const binaryArgs = hexToNodeBuffer(this.lock.script.args);
      let lockQuery = this.knex("scripts")
        .select("id")
        .where({
          code_hash: hexToNodeBuffer(this.lock.script.code_hash),
          hash_type: this.lock.script.hash_type === "type" ? 1 : 0,
        })
        .whereRaw("substring(args, 1, ?) = ?", [
          binaryArgs.byteLength,
          binaryArgs,
        ]);
      if (this.lock.argsLen !== "any" && this.lock.argsLen > 0) {
        lockQuery = lockQuery.whereRaw("length(args) = ?", [this.lock.argsLen]);
      }
      query = query.andWhere(function () {
        return this.whereIn("lock_script_id", lockQuery);
      });
    }
    if (this.type) {
      if (this.type !== "empty") {
        const binaryArgs = hexToNodeBuffer(this.type.script.args);
        let typeQuery = this.knex("scripts")
          .select("id")
          .where({
            code_hash: hexToNodeBuffer(this.type.script.code_hash),
            hash_type: this.type.script.hash_type === "type" ? 1 : 0,
          })
          .whereRaw("substring(args, 1, ?) = ?", [
            binaryArgs.byteLength,
            binaryArgs,
          ]);
        if (this.type.argsLen !== "any" && this.type.argsLen > 0) {
          typeQuery = typeQuery.whereRaw("length(args) = ?", [
            this.type.argsLen,
          ]);
        }
        query = query.andWhere(function () {
          return this.whereIn("type_script_id", typeQuery);
        });
      } else {
        query = query.whereNull("type_script_id");
      }
    }
    if (this.data !== "any") {
      query = query.andWhere("data", hexToNodeBuffer(this.data));
    }
    if (this.skip) {
      query = query.offset(this.skip);
    }
    return query;
  }

  async count() {
    return parseInt((await this._assembleQuery(false)).length);
  }

  async *collect() {
    // TODO: optimize this with streams
    const items = await this._assembleQuery()
      .innerJoin(
        "block_digests",
        "cells.block_number",
        "block_digests.block_number"
      )
      .innerJoin(
        this.knex.ref("scripts").as("lock_scripts"),
        "cells.lock_script_id",
        "lock_scripts.id"
      )
      .leftJoin(this.knex.ref("scripts").as("type_scripts"), function () {
        this.onNotNull("cells.type_script_id").on(
          "cells.type_script_id",
          "=",
          "type_scripts.id"
        );
      })
      .select(
        "block_digests.*",
        "cells.*",
        this.knex.ref("lock_scripts.code_hash").as("lock_script_code_hash"),
        this.knex.ref("lock_scripts.hash_type").as("lock_script_hash_type"),
        this.knex.ref("lock_scripts.args").as("lock_script_args"),
        this.knex.ref("type_scripts.code_hash").as("type_script_code_hash"),
        this.knex.ref("type_scripts.hash_type").as("type_script_hash_type"),
        this.knex.ref("type_scripts.args").as("type_script_args")
      );
    for (const item of items) {
      yield {
        cell_output: {
          capacity: dbBigIntToHex(item.capacity),
          lock: dbItemToScript(
            item.lock_script_code_hash,
            item.lock_script_hash_type,
            item.lock_script_args
          ),
          type: dbItemToScript(
            item.type_script_code_hash,
            item.type_script_hash_type,
            item.type_script_args
          ),
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
