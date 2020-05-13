const { validators, normalizers, Reader } = require("ckb-js-toolkit");
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

  getLiveCellsByLockScript(
    script,
    { validateFirst = true, returnRawBuffer = false } = {}
  ) {
    return this._getLiveCellsByScript(
      script,
      0,
      validateFirst,
      returnRawBuffer
    );
  }

  getLiveCellsByTypeScript(
    script,
    { validateFirst = true, returnRawBuffer = false } = {}
  ) {
    return this._getLiveCellsByScript(
      script,
      1,
      validateFirst,
      returnRawBuffer
    );
  }

  _getLiveCellsByScript(script, scriptType, validateFirst, returnRawBuffer) {
    if (validateFirst) {
      validators.ValidateScript(script);
    }
    return this.nativeIndexer.getLiveCellsByScript(
      normalizers.NormalizeScript(script),
      scriptType,
      returnRawBuffer
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

  collector({ lock = null, type_ = null } = {}, { skipNotLive = false } = {}) {
    return new CellCollector(this, { lock, type_ }, { skipNotLive });
  }
}

class BufferValue {
  constructor(buffer) {
    this.buffer = buffer;
  }

  equals(other) {
    return (
      new Reader(this.buffer).serializeJson() ===
      new Reader(other.buffer).serializeJson()
    );
  }

  hashCode() {
    return XXHash.hash(Buffer.from(this.buffer), 0);
  }
}

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
  }

  async *collect() {
    let outPoints = new Set();
    if (this.lock) {
      for (const o of this.indexer.getLiveCellsByLockScript(this.lock, {
        validateFirst: false,
        returnRawBuffer: true,
      })) {
        outPoints = outPoints.add(new BufferValue(o));
      }
    }
    if (this.type_) {
      for (const o of this.indexer.getLiveCellsByTypeScript(this.type_, {
        validateFirst: false,
        returnRawBuffer: true,
      })) {
        outPoints = outPoints.add(new BufferValue(o));
      }
    }
    for (const o of outPoints) {
      const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o.buffer);
      if (!this.skipNotLive && !cell) {
        throw new Error(`Cell ${o.tx_hash} @ ${o.index} is not live!`);
      }
      yield cell;
    }
  }
}

// Notice this TransactionCollector implementation only uses indexer
// here. Since the indexer we use doesn't store full transaction data,
// we will have to run CKB RPC queries on each tx hash to fetch transaction
// data. In some cases this might slow your app down. An ideal solution would
// be combining this with some cacher to accelerate this process.
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
