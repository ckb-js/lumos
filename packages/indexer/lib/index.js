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

  // TODO: optimize this
  async count() {
    let result = 0;
    const c = this.collect();
    while (true) {
      const item = await c.next();
      if (item.done) {
        break;
      }
      result += 1;
    }
    return result;
  }

  async *collect() {
    if (this.lock && this.type) {
      let lockOutPoints = new Set();
      for (const o of this.indexer._getLiveCellsByScript(
        this.lock,
        0,
        false,
        true
      )) {
        lockOutPoints = lockOutPoints.add(new BufferValue(o));
      }
      let typeOutPoints = new Set();
      for (const o of this.indexer._getLiveCellsByScript(
        this.type,
        1,
        false,
        true
      )) {
        typeOutPoints = typeOutPoints.add(new BufferValue(o));
      }
      const outPoints = lockOutPoints.intersect(typeOutPoints);
      for (const o of outPoints) {
        const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o.buffer);
        if (!this.skipNotLive && !cell) {
          throw new Error(`Cell ${o.tx_hash} @ ${o.index} is not live!`);
        }
        yield cell;
      }
    } else {
      const script = this.lock || this.type;
      const scriptType = !!this.lock ? 0 : 1;
      for (const o of this.indexer._getLiveCellsByScript(
        script,
        scriptType,
        false,
        true
      )) {
        const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o);
        if (!this.skipNotLive && !cell) {
          throw new Error(`Cell ${o.tx_hash} @ ${o.index} is not live!`);
        }
        yield cell;
      }
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

  async count() {
    if (this.lock && this.type) {
      const lockHashes = new Set(
        this.indexer
          ._getTransactionsByScriptIterator(this.lock, 0, false)
          .collect()
      );
      const typeHashes = new Set(
        this.indexer
          ._getTransactionsByScriptIterator(this.type, 1, false)
          .collect()
      );
      const hashes = lockHashes.intersect(typeHashes);
      return hashes.size;
    } else {
      const script = this.lock || this.type;
      const scriptType = !!this.lock ? 0 : 1;
      const iter = this.indexer._getTransactionsByScriptIterator(
        script,
        scriptType,
        false
      );
      return iter.count();
    }
  }

  async *collect() {
    if (this.lock && this.type) {
      const lockHashes = new Set(
        this.indexer
          ._getTransactionsByScriptIterator(this.lock, 0, false)
          .collect()
      );
      const typeHashes = new Set(
        this.indexer
          ._getTransactionsByScriptIterator(this.type, 1, false)
          .collect()
      );
      const hashes = lockHashes.intersect(typeHashes);
      for (const h of hashes) {
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
    } else {
      const script = this.lock || this.type;
      const scriptType = !!this.lock ? 0 : 1;
      const iter = this.indexer._getTransactionsByScriptIterator(
        script,
        scriptType,
        false
      );
      while (true) {
        const hash = iter.next();
        if (!hash) {
          break;
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
