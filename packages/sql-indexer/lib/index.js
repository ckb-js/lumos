const { RPC, Reader } = require("ckb-js-toolkit");

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

async function ensureScriptInserted(trx, script) {
  const data = {
    code_hash: hexToNodeBuffer(script.code_hash),
    hash_type: script.hash_type === "type" ? 1 : 0,
    args: hexToNodeBuffer(script.args),
  };
  let ids = await trx("scripts").where(data).select("id");
  if (ids.length === 0) {
    ids = await trx("scripts").insert([data], ["id"]);
  }
  if (ids.length === 0) {
    throw new Error("Insertion failure!");
  }
  return ids[0].id;
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

      const txIds = await trx("transaction_digests").insert(
        block.transactions.map((tx, i) => {
          return {
            tx_hash: hexToNodeBuffer(tx.hash),
            tx_index: i,
            output_count: tx.outputs.length,
            block_number: blockNumber,
          };
        }),
        ["id"]
      );

      for (const [txIndex, tx] of block.transactions.entries()) {
        const txId = txIds[txIndex].id;
        // Skip cellbase inputs
        if (txIndex > 0) {
          for (const [inputIndex, input] of tx.inputs.entries()) {
            const data = await trx("cells")
              .where({
                tx_hash: hexToNodeBuffer(input.previous_output.tx_hash),
                index: hexToDbBigInt(input.previous_output.index),
              })
              .update({ consumed: true }, ["lock_script_id", "type_script_id"]);
            for (const { lock_script_id, type_script_id } of data) {
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
          const lockScriptId = await ensureScriptInserted(trx, output.lock);
          let typeScriptId = null;
          if (output.type) {
            typeScriptId = await ensureScriptInserted(trx, output.type);
          }
          await trx("cells").insert({
            consumed: false,
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
          .andWhere("blockNumber", "<", pruneToBlock)
          .del();
        await trx("transaction_inputs")
          .whereIn("transaction_digest_id", function () {
            return this.from("transaction_digests")
              .select("id")
              .where("blockNumber", "<", pruneToBlock);
          })
          .del();
      });
    }
  }

  collector() {
    throw new Error("TODO: we will add collector implementation later!");
  }
}

module.exports = {
  Indexer,
};
