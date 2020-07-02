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

  _getLiveCellsByScript(script, scriptType, argsLen, returnRawBuffer) {
    return this.nativeIndexer.getLiveCellsByScript(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      returnRawBuffer
    );
  }

  _getTransactionsByScriptIterator(script, scriptType, fromBlock, toBlock) {
    return this.nativeIndexer.getTransactionsByScriptIterator(
      normalizers.NormalizeScript(script),
      scriptType,
      ioType,
      fromBlock,
      toBlock
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
    if (type && typeof type === "object") {
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
    { lock = null, type = null, fromBlock = null, toBlock = null } = {},
    { skipMissing = false, includeStatus = true } = {}
  ) {
    if (!lock && !type) {
      throw new Error("Either lock or type script must be provided!");
    }

    if (lock && !lock.script) {
      validators.ValidateScript(lock);
    }

    if (lock && lock.script) {
      validators.ValidateScript(lock.script);
    }

    if (type && !type.script) {
      validators.ValidateScript(type);
    }

    if (type && type.script) {
      validators.ValidateScript(type.script);
    }

    this.indexer = indexer;
    this.lock = lock;
    this.type = type;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.rpc = new RPC(indexer.uri);
  }

  async count() {
    let hashes = null;
    let lockHashes = null;
    let typeHashes = null;

    if (this.lock) {
      let script_type = 0;
      let script = null;
      let io_type = null;
      if (!this.lock.script) {
        script = this.lock;
      } else {
        script = this.lock.script;
        if (this.lock.io_type == "input") {
          io_type = 0;
        } else if (this.lock.io_type == "output") {
          io_type = 1;
        } else {
          throw new Error("io_type should be either input or output");
        }
      }
      lockHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            script,
            script_type,
            io_type,
            this.fromBlock,
            this.toBlock
          )
          .collect()
      );
    }

    if (this.type) {
      let script_type = 1;
      let script = null;
      let io_type = null;
      if (!this.type.script) {
        script = this.type;
      } else {
        script = this.type.script;
        if (this.type.io_type == "input") {
          io_type = 0;
        } else if (this.type.io_type == "output") {
          io_type = 1;
        } else {
          throw new Error("io_type should be either input or output");
        }
      }
      typeHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            script,
            script_type,
            io_type,
            this.fromBlock,
            this.toBlock
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

    return hashes.size;
  }

  async *collect() {
    let hashes = null;
    let lockHashes = null;
    let typeHashes = null;

    if (this.lock) {
      let script_type = 0;
      let script = null;
      let io_type = null;
      // here must keep consistent with low level storage impl:
      // input => 0, output => 1
      if (!this.lock.script) {
        script = this.lock;
      } else {
        script = this.lock.script;
        if (this.lock.io_type == "input") {
          io_type = 0;
        } else if (this.lock.io_type == "output") {
          io_type = 1;
        } else {
          throw new Error("io_type should be either input or output");
        }
      }
      lockHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            script,
            script_type,
            io_type,
            this.fromBlock,
            this.toBlock
          )
          .collect()
      );
    }

    if (this.type) {
      let script_type = 1;
      let script = null;
      let io_type = null;
      if (!this.type.script) {
        script = this.type;
      } else {
        script = this.type.script;
        if (this.type.io_type == "input") {
          io_type = 0;
        } else if (this.type.io_type == "output") {
          io_type = 1;
        } else {
          throw new Error("io_type should be either input or output");
        }
      }
      typeHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            script,
            script_type,
            io_type,
            this.fromBlock,
            this.toBlock
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
