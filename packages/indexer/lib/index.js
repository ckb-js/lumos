const { validators, normalizers, Reader, RPC } = require("ckb-js-toolkit");
const { OrderedSet } = require("immutable");
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

  _getLiveCellsByScript(script, scriptType, argsLen, returnRawBuffer) {
    return this.nativeIndexer.getLiveCellsByScript(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      returnRawBuffer
    );
  }

  _getTransactionsByScriptIterator(script, scriptType) {
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

  collector({ lock = null, type = null, argsLen = -1, data = "0x" } = {}) {
    return new CellCollector(this, { lock, type, argsLen, data });
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
  // if data left null, means every data content is ok
  constructor(
    indexer,
    { lock = null, type = null, argsLen = -1, data = "0x" } = {}
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
    this.data = data;
    this.argsLen = argsLen;
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
    if (this.lock && this.type && typeof this.type === "object") {
      let lockOutPoints = new OrderedSet();
      for (const o of this.indexer._getLiveCellsByScript(
        this.lock,
        0,
        this.argsLen,
        true
      )) {
        lockOutPoints = lockOutPoints.add(new BufferValue(o));
      }

      let typeOutPoints = new OrderedSet();
      for (const o of this.indexer._getLiveCellsByScript(
        this.type,
        1,
        this.argsLen,
        true
      )) {
        typeOutPoints = typeOutPoints.add(new BufferValue(o));
      }
      const outPoints = lockOutPoints.intersect(typeOutPoints);
      for (const o of outPoints) {
        const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o.buffer);
        if (this.data && cell.data !== this.data) {
          continue;
        }
        yield cell;
      }
    } else {
      const script = this.lock || this.type;
      const scriptType = !!this.lock ? 0 : 1;
      for (const o of this.indexer._getLiveCellsByScript(
        script,
        scriptType,
        this.argsLen,
        true
      )) {
        const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o);
        if (
          cell &&
          scriptType === 1 &&
          this.type === "empty" &&
          cell.cell_output.type
        ) {
          continue;
        }
        if (cell && this.data && cell.data !== this.data) {
          continue;
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
      const lockHashes = new OrderedSet(
        this.indexer._getTransactionsByScriptIterator(this.lock, 0).collect()
      );
      const typeHashes = new OrderedSet(
        this.indexer._getTransactionsByScriptIterator(this.type, 1).collect()
      );
      const hashes = lockHashes.intersect(typeHashes);
      return hashes.size;
    } else {
      const script = this.lock || this.type;
      const scriptType = !!this.lock ? 0 : 1;
      const iter = this.indexer._getTransactionsByScriptIterator(
        script,
        scriptType
      );
      return iter.count();
    }
  }

  async *collect() {
    if (this.lock && this.type) {
      const lockHashes = new OrderedSet(
        this.indexer._getTransactionsByScriptIterator(this.lock, 0).collect()
      );
      const typeHashes = new OrderedSet(
        this.indexer._getTransactionsByScriptIterator(this.type, 1).collect()
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
        scriptType
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
