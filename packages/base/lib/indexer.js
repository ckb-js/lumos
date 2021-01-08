const { validators, RPC } = require("ckb-js-toolkit");
const utils = require("./utils");

// Notice this TransactionCollector implementation only uses indexer
// here. Since the indexer we use doesn't store full transaction data,
// we will have to run CKB RPC queries on each tx hash to fetch transaction
// data. In some cases this might slow your app down. An ideal solution would
// be combining this with some cacher to accelerate this process.
class TransactionCollector {
  constructor(
    indexer,
    {
      lock = null,
      type = null,
      argsLen = -1,
      fromBlock = null,
      toBlock = null,
      order = "asc",
      skip = null,
    } = {},
    { skipMissing = false, includeStatus = true } = {}
  ) {
    if (!lock && (!type || type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }
    // Wrap the plain `Script` into `ScriptWrapper`.
    if (lock && !lock.script) {
      validators.ValidateScript(lock);
      this.lock = { script: lock, ioType: "both", argsLen: argsLen };
    } else if (lock && lock.script) {
      validators.ValidateScript(lock.script);
      this.lock = lock;
      // check ioType, argsLen
      if (!lock.argsLen) {
        this.lock.argsLen = argsLen;
      }
      if (!lock.ioType) {
        this.lock.ioType = "both";
      }
    }
    if (type === "empty") {
      this.type = type;
    } else if (type && !type.script) {
      validators.ValidateScript(type);
      this.type = { script: type, ioType: "both", argsLen: argsLen };
    } else if (type && type.script) {
      validators.ValidateScript(type.script);
      this.type = type;
      // check ioType, argsLen
      if (!type.argsLen) {
        this.type.argsLen = argsLen;
      }
      if (!type.ioType) {
        this.type.ioType = "both";
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
    this.indexer = indexer;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.order = order;
    this.skip = skip;
    this.rpc = new RPC(indexer.uri);
  }

  async getTransactionHashes() {
    throw new Error("Not implement!");
  }

  async count() {
    let hashes = await this.getTransactionHashes();
    return hashes.size;
  }

  async *collect() {
    let hashes = await this.getTransactionHashes();
    for (const hash of hashes) {
      const tx = await this.rpc.get_transaction(hash);
      if (!this.skipMissing && !tx) {
        throw new Error(`Transaction ${h} is missing!`);
      }
      if (this.includeStatus) {
        yield tx;
      } else {
        yield tx.transaction;
      }
    }
  }
}

module.exports = {
  TransactionCollector,
};
