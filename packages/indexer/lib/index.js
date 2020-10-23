const { validators, normalizers, Reader, RPC } = require("ckb-js-toolkit");
const { OrderedSet } = require("immutable");
const XXHash = require("xxhash");
const { Indexer: NativeIndexer, Emitter } = require("../native");
const { EventEmitter } = require("events");
const util = require("util");
const { utils } = require("@ckb-lumos/base");

util.inherits(Emitter, EventEmitter);

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
    order,
    skip
  ) {
    return this.nativeIndexer.getLiveCellsByScriptIterator(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      fromBlock,
      toBlock,
      order,
      skip
    );
  }

  _getTransactionsByScriptIterator(
    script,
    scriptType,
    argsLen,
    ioType,
    fromBlock,
    toBlock,
    order,
    skip
  ) {
    return this.nativeIndexer.getTransactionsByScriptIterator(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      ioType,
      fromBlock,
      toBlock,
      order,
      skip
    );
  }

  _getEmitter(script, scriptType, argsLen, data, fromBlock) {
    const outputData = data === "any" ? null : new Reader(data).toArrayBuffer();
    return this.nativeIndexer.getEmitter(
      normalizers.NormalizeScript(script),
      scriptType,
      argsLen,
      outputData,
      fromBlock
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

  async init_db_from_json_file(file_path) {
    this.nativeIndexer.init_db_from_json_file(file_path);
  }

  collector({
    lock = null,
    type = null,
    argsLen = -1,
    data = "any",
    fromBlock = null,
    toBlock = null,
    skip = null,
  } = {}) {
    return new CellCollector(this, {
      lock,
      type,
      argsLen,
      data,
      fromBlock,
      toBlock,
      skip,
    });
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
    let script = null;
    let scriptType = null;
    if (fromBlock) {
      utils.assertHexadecimal("fromBlock", fromBlock);
    }
    if (toBlock !== null || skip !== null) {
      this.logger(
        "warn",
        "The passing fileds toBlock and skip are ignored in subscribe() method."
      );
    }
    if (lock) {
      validators.ValidateScript(lock);
      scriptType = 0;
      script = lock;
    } else if (type) {
      validators.ValidateScript(type);
      scriptType = 1;
      script = type;
    } else {
      throw new Error("Either lock or type script must be provided!");
    }
    return this._getEmitter(script, scriptType, argsLen, data, fromBlock);
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
  // if data equals 'any', means every data content is ok
  constructor(
    indexer,
    {
      lock = null,
      type = null,
      argsLen = -1,
      data = "any",
      fromBlock = null,
      toBlock = null,
      order = "asc",
      skip = null,
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
    this.indexer = indexer;
    this.data = data;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.order = order;
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
            this.lock.script,
            scriptType,
            this.lock.argsLen,
            this.fromBlock,
            this.toBlock,
            this.order,
            this.skip
          )
          .collect(returnRawBuffer)
      );
      lockOutPoints = this.wrapOutPoints(lockOutPoints);
    }

    if (this.type && this.type !== "empty") {
      const scriptType = 1;
      typeOutPoints = new OrderedSet(
        this.indexer
          ._getLiveCellsByScriptIterator(
            this.type.script,
            scriptType,
            this.type.argsLen,
            this.fromBlock,
            this.toBlock,
            this.order,
            this.skip
          )
          .collect(returnRawBuffer)
      );
      typeOutPoints = this.wrapOutPoints(typeOutPoints);
    }
    let outPoints = null;
    if (this.lock && this.type && this.type !== "empty") {
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
            this.lock.argsLen,
            this.lock.ioType,
            this.fromBlock,
            this.toBlock,
            this.order,
            this.skip
          )
          .collect()
      );
    }

    if (this.type && this.type !== "empty") {
      const scriptType = 1;
      typeHashes = new OrderedSet(
        this.indexer
          ._getTransactionsByScriptIterator(
            this.type.script,
            scriptType,
            this.type.argsLen,
            this.type.ioType,
            this.fromBlock,
            this.toBlock,
            this.order,
            this.skip
          )
          .collect()
      );
    }

    if (this.lock && this.type && this.type !== "empty") {
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
