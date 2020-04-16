const { validators, normalizers, RPC } = require("ckb-js-toolkit");
const { Set } = require("immutable");
const XXHash = require("xxhash");
const { Indexer: NativeIndexer } = require("../native");

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

class Indexer {
  constructor(
    uri,
    path,
    {
      pollIntervalSeconds = 2,
      livenessCheckIntervalSeconds = 5,
      logger = defaultLogger,
    } = {}
  ) {
    this.uri = uri;
    this.livenessCheckIntervalSeconds = livenessCheckIntervalSeconds;
    this.logger = logger;
    this.nativeIndexer = new NativeIndexer(uri, path, pollIntervalSeconds);
  }

  running() {
    return this.nativeIndexer.running();
  }

  start() {
    return this.nativeIndexer.start();
  }

  stop() {
    return this.nativeIndexer.stop();
  }

  tip() {
    return this.nativeIndexer.tip();
  }

  getLiveCellsByLockScript(script, { validateFirst = true } = {}) {
    return this._getLiveCellsByScript(script, 0, validateFirst);
  }

  getLiveCellsByTypeScript(script, { validateFirst = true } = {}) {
    return this._getLiveCellsByScript(script, 1, validateFirst);
  }

  _getLiveCellsByScript(script, scriptType, validateFirst) {
    if (validateFirst) {
      validators.ValidateScript(script);
    }
    return this.nativeIndexer.getLiveCellsByScript(
      normalizers.NormalizeScript(script),
      scriptType
    );
  }

  getTransactionsByLockScript(script, { validateFirst = true } = {}) {
    return this._getTransactionsByScript(script, 0, validateFirst);
  }

  getTransactionsByTypeScript(script, { validateFirst = true } = {}) {
    return this._getTransactionsByScript(script, 1, validateFirst);
  }

  _getTransactionsByScript(script, scriptType, validateFirst) {
    if (validateFirst) {
      validators.ValidateScript(script);
    }
    return this.nativeIndexer.getTransactionsByScript(
      normalizers.NormalizeScript(script),
      scriptType
    );
  }

  startForever() {
    this.nativeIndexer.start();
    setInterval(() => {
      if (!this.nativeIndexer.running()) {
        this.logger(
          "error",
          "Native indexer has stopped, maybe check the log?"
        );
        this.nativeIndexer.start();
      }
    }, this.livenessCheckIntervalSeconds * 1000);
  }
}

class OutPoint {
  constructor({ tx_hash, index }) {
    this.tx_hash = tx_hash;
    this.index = index;
  }

  serializeJson() {
    return {
      tx_hash: this.tx_hash,
      index: this.index,
    };
  }

  equals(other) {
    return this.tx_hash === other.tx_hash && this.index === other.index;
  }

  hashCode() {
    return XXHash.hash(Buffer.from(this.tx_hash + this.index, "utf8"), 0);
  }
}

// Notice this is a CellCollector implementation that only uses indexer
// here. Since the indexer we use only keeps live cell OutPoints in storage,
// it means we will have to run CKB RPC queries on each OutPoint to fetch cell
// data. In some cases this might slow your app down. An ideal solution would
// be combining this with lumos-cacher to accelerate this process.
class CellCollector {
  constructor(
    indexer,
    { lock = null, type_ = null } = {},
    { skipNotLive = false } = {}
  ) {
    if (!lock && !type_) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (lock) {
      validators.ValidateScript(lock);
    }
    if (type_) {
      validators.ValidateScript(type_);
    }
    this.indexer = indexer;
    this.lock = lock;
    this.type_ = type_;
    this.skipNotLive = skipNotLive;
    this.rpc = new RPC(indexer.uri);
  }

  async *collect() {
    let outPoints = new Set();
    if (this.lock) {
      for (const o of this.indexer.getLiveCellsByLockScript(this.lock, {
        validateFirst: false,
      })) {
        outPoints = outPoints.add(new OutPoint(o));
      }
    }
    if (this.type_) {
      for (const o of this.indexer.getLiveCellsByTypeScript(this.type_, {
        validateFirst: false,
      })) {
        outPoints = outPoints.add(new OutPoint(o));
      }
    }
    for (const o of outPoints) {
      const cell = await this.rpc.get_live_cell(o.serializeJson(), true);
      const tx = await this.rpc.get_transaction(o.tx_hash);
      if (
        !this.skipNotLive &&
        (cell.status !== "live" || !tx || !tx.tx_status.block_hash)
      ) {
        throw new Error(`Cell ${o.tx_hash} @ ${o.index} is not live!`);
      }
      yield {
        cell_output: cell.cell.output,
        out_point: o.serializeJson(),
        block_hash: tx.tx_status.block_hash,
        data: cell.cell.data.content,
      };
    }
  }
}

// See the above comment on CellCollector, TransactionCollector here suffers
// the same issue that we have to perform RPC calls for each transaction to
// fetch the data.
class TransactionCollector {
  constructor(
    indexer,
    { lock = null, type_ = null } = {},
    { skipMissing = false, includeStatus = true } = {}
  ) {
    if (!lock && !type_) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (lock) {
      validators.ValidateScript(lock);
    }
    if (type_) {
      validators.ValidateScript(type_);
    }
    this.indexer = indexer;
    this.lock = lock;
    this.type_ = type_;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.rpc = new RPC(indexer.uri);
  }

  async *collect() {
    let hashes = new Set();
    if (this.lock) {
      for (const h of this.indexer.getTransactionsByLockScript(this.lock, {
        validateFirst: false,
      })) {
        hashes = hashes.add(h);
      }
    }
    if (this.type_) {
      for (const h of this.indexer.getTransactionsByTypeScript(this.type_, {
        validateFirst: false,
      })) {
        hashes = hashes.add(h);
      }
    }
    for (const h of hashes) {
      const tx = await this.rpc.get_transaction(h);
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
  Indexer,
  CellCollector,
  TransactionCollector,
};
