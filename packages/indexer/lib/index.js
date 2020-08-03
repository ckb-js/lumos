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

  async tip() {
    return this.nativeIndexer.tip();
  }

  _getLiveCellsByScriptIterator(
    script,
    scriptType,
    argsLen,
    fromBlock,
    toBlock,
    skip
  ) {
    return this.nativeIndexer.getLiveCellsByScriptIterator(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      fromBlock,
      toBlock,
      skip
    );
  }

  _getTransactionsByScriptIterator(
    script,
    scriptType,
    ioType,
    fromBlock,
    toBlock,
    skip
  ) {
    return this.nativeIndexer.getTransactionsByScriptIterator(
      normalizers.NormalizeScript(script),
      scriptType,
      ioType,
      fromBlock,
      toBlock,
      skip
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
    {
      lock = null,
      type = null,
      argsLen = -1,
      data = "0x",
      fromBlock = null,
      toBlock = null,
      skip = null,
    } = {}
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
    this.indexer = indexer;
    this.lock = lock;
    this.type = type;
    this.data = data;
    this.argsLen = argsLen;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.skip = skip;
  }

  getLiveCellOutPoints() {
    let lockOutPoints = null;
    let typeOutPoints = null;
    const returnRawBuffer = true;
    if (this.lock) {
      const scriptType = 0;
      lockOutPoints = new OrderedSet(
        this.indexer
          ._getLiveCellsByScriptIterator(
            this.lock,
            scriptType,
            this.argsLen,
            this.fromBlock,
            this.toBlock,
            this.skip
          )
          .collect(returnRawBuffer)
      );
      lockOutPoints = this.wrapOutPoints(lockOutPoints);
    }

    if (this.type) {
      const scriptType = 1;
      typeOutPoints = new OrderedSet(
        this.indexer
          ._getLiveCellsByScriptIterator(
            this.type,
            scriptType,
            this.argsLen,
            this.fromBlock,
            this.toBlock,
            this.skip
          )
          .collect(returnRawBuffer)
      );
      typeOutPoints = this.wrapOutPoints(typeOutPoints);
    }
    let outPoints = null;
    if (this.lock && this.type) {
      outPoints = lockOutPoints.intersect(typeOutPoints);
    } else if (this.lock) {
      outPoints = lockOutPoints;
    } else {
      outPoints = typeOutPoints;
    }
    return outPoints;
  }

  wrapOutPoints(outPoints) {
    let outPointsBufferValue = new OrderedSet();
    for (const o of outPoints) {
      outPointsBufferValue = outPointsBufferValue.add(new BufferValue(o));
    }
    return outPointsBufferValue;
  }

  async count() {
    let outPoints = this.getLiveCellOutPoints();
    let counter = 0;
    for (const o of outPoints) {
      const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o.buffer);
      if (cell && this.type === "empty" && cell.cell_output.type) {
        continue;
      }
      if (this.data !== "any" && cell.data !== this.data) {
        continue;
      }
      counter += 1;
    }

    return counter;
  }

  async *collect() {
    let outPoints = this.getLiveCellOutPoints();
    for (const o of outPoints) {
      const cell = this.indexer.nativeIndexer.getDetailedLiveCell(o.buffer);
      if (cell && this.type === "empty" && cell.cell_output.type) {
        continue;
      }
      if (this.data !== "any" && cell.data !== this.data) {
        continue;
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
    {
      lock = null,
      type = null,
      fromBlock = null,
      toBlock = null,
      skip = null,
    } = {},
    { skipMissing = false, includeStatus = true } = {}
  ) {
    if (!lock && !type) {
      throw new Error("Either lock or type script must be provided!");
    }
    // Wrap the plain `Script` to `ScriptWrapper`.
    if (lock && !lock.script) {
      validators.ValidateScript(lock);
      this.lock = { script: lock, ioType: "both" };
    } else if (lock && lock.script) {
      validators.ValidateScript(lock.script);
      this.lock = lock;
    }

    if (type && !type.script) {
      validators.ValidateScript(type);
      this.lock = { script: type, ioType: "both" };
    } else if (type && type.script) {
      validators.ValidateScript(type.script);
      this.type = type;
    }

    this.indexer = indexer;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.skip = skip;
    this.rpc = new RPC(indexer.uri);
  }

  getTransactionHashes() {
    let hashes = null;
    let lockHashes = null;
    let typeHashes = null;

    if (this.lock) {
      const scriptType = 0;
      lockHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            this.lock.script,
            scriptType,
            this.lock.ioType,
            this.fromBlock,
            this.toBlock,
            this.skip
          )
          .collect()
      );
    }

    if (this.type) {
      const scriptType = 1;
      typeHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            script,
            scriptType,
            this.lock.ioType,
            this.fromBlock,
            this.toBlock,
            this.skip
          )
          .collect()
      );
    }

    if (this.lock && this.type) {
      hashes = lockHashes.intersect(typeHashes);
    } else if (this.lock) {
      hashes = lockHashes;
    } else {
      hashes = typeHashes;
    }
    return hashes;
  }

  async count() {
    let hashes = this.getTransactionHashes();
    return hashes.size;
  }

  async *collect() {
    let hashes = this.getTransactionHashes();
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
  Indexer,
  CellCollector,
  TransactionCollector,
};
