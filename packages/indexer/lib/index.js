const { validators, normalizers, Reader, RPC } = require("ckb-js-toolkit");
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

  getTransactionsByLockScriptIterator(script, { validateFirst = true } = {}) {
    return this._getTransactionsByScriptIterator(script, 0, validateFirst);
  }

  getTransactionsByTypeScriptIterator(script, { validateFirst = true } = {}) {
    return this._getTransactionsByScriptIterator(script, 1, validateFirst);
  }

  _getTransactionsByScriptIterator(script, scriptType, validateFirst) {
    if (validateFirst) {
      validators.ValidateScript(script);
    }
    return this.nativeIndexer.getTransactionsByScriptIterator(
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

  collector({ lock = null, type = null } = {}, { skipNotLive = false } = {}) {
    return new CellCollector(this, { lock, type }, { skipNotLive });
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
    { lock = null, type = null } = {},
    { skipNotLive = false } = {}
  ) {
    if (!lock && !type) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (lock) {
      validators.ValidateScript(lock);
    }
    if (type) {
      validators.ValidateScript(type);
    }
    this.indexer = indexer;
    this.lock = lock;
    this.type = type;
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
    if (this.type) {
      for (const o of this.indexer.getLiveCellsByTypeScript(this.type, {
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
    { lock = null, type = null } = {},
    { skipMissing = false, includeStatus = true } = {}
  ) {
    if (!lock && !type) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (lock) {
      validators.ValidateScript(lock);
    }
    if (type) {
      validators.ValidateScript(type);
    }
    this.indexer = indexer;
    this.lock = lock;
    this.type = type;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.rpc = new RPC(indexer.uri);
  }

  async *collect() {
    let hashes = new Set();
    if (this.lock) {
      const iter = this.indexer.getTransactionsByLockScriptIterator(this.lock, {
        validateFirst: false,
      });
      while (true) {
        const hash = iter.next();
        if (!hash) {
          break;
        }
        hashes = hashes.add(hash);
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
    if (this.type) {
      const iter = this.indexer.getTransactionsByTypeScriptIterator(this.type, {
        validateFirst: false,
      });
      while (true) {
        const hash = iter.next();
        if (!hash) {
          break;
        }
        if (hashes.has(hash)) {
          continue;
        }
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
}

module.exports = {
  Indexer,
  CellCollector,
  TransactionCollector,
};
