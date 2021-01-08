const { validators, normalizers, Reader, RPC } = require("ckb-js-toolkit");
const { OrderedSet, Map } = require("immutable");
const XXHash = require("xxhash");
const { Indexer: NativeIndexer, Emitter, BlockEmitter } = require("../native");
const { EventEmitter } = require("events");
const util = require("util");
const { utils, indexer: BaseIndexerModule } = require("@ckb-lumos/base");

util.inherits(Emitter, EventEmitter);
util.inherits(BlockEmitter, EventEmitter);

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

function asyncSleep(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}

class EventMap {
  constructor() {
    this.map = Map();
  }

  add(key, value) {
    this.map[key] = this.map[key] || 0;
    if (this.map[key] === 0) {
      this.map = this.map.set(key, value);
    }
    this.map[key] = this.map[key] + 1;
  }

  get(key) {
    return this.map.get(key);
  }

  reduce(key) {
    const size = this.map[key];
    if (size === undefined) {
      return;
    }
    if (size === 1) {
      this.map = this.map.delete(key);
      this.map[key] = undefined;
      return;
    }
    this.map[key] = this.map[key] - 1;
  }

  isEmpty() {
    return this.map.size === 0;
  }
}

class MedianTimeEmitter extends EventEmitter {
  static EVENT_NAME = "changed";
  constructor(blockEmitter, rpc) {
    super();
    this.blockEmitter = blockEmitter;
    this.rpc = rpc;

    this.superListener = (listener) => {
      return async () => {
        const info = await this.rpc.get_blockchain_info();
        return await listener(info.median_time);
      };
    };

    this.blockListened = false;
    this.superListeners = new EventMap();

    this.blockEmitterListener = () => {
      this.emit(MedianTimeEmitter.EVENT_NAME);
    };
  }

  addListener(eventName, listener) {
    if (!this.blockListened) {
      this.blockEmitter.on(
        MedianTimeEmitter.EVENT_NAME,
        this.blockEmitterListener
      );
      this.blockListened = true;
    }

    if (eventName !== MedianTimeEmitter.EVENT_NAME) {
      return this;
    }

    const lis = this.superListener(listener);
    this.superListeners.add(listener, lis);
    return super.on(eventName, lis);
  }

  on = this.addListener;

  removeListener(eventName, listener) {
    if (eventName !== MedianTimeEmitter.EVENT_NAME) {
      return this;
    }

    const superListener = this.superListeners.get(listener);
    if (superListener === undefined) {
      return super.removeListener(eventName, this.superListener(listener));
    }
    this.superListeners.reduce(listener);
    if (this.superListeners.isEmpty()) {
      this.blockEmitter.removeListener(
        MedianTimeEmitter.EVENT_NAME,
        this.blockEmitterListener
      );
      this.blockListened = false;
    }
    return super.removeListener(eventName, superListener);
  }

  off = this.removeListener;
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
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.rpc = new RPC(this.uri);
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

  async waitForSync(blockDifference = 3) {
    const rpc = new RPC(this.uri);
    while (true) {
      const tip = await this.tip();
      const indexedNumber = tip ? BigInt(tip.block_number) : 0n;
      const ckbTip = await rpc.get_tip_block_number();

      if (BigInt(ckbTip) - indexedNumber <= BigInt(blockDifference)) {
        break;
      }

      await asyncSleep(1000 * this.pollIntervalSeconds);
    }
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

  _getBlockEmitter() {
    if (this.blockEmitter === undefined || this.blockEmitter === null) {
      this.blockEmitter = this.nativeIndexer.getBlockEmitter();
    }
    return this.blockEmitter;
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

  subscribeMedianTime() {
    const blockEmitter = this._getBlockEmitter();
    return new MedianTimeEmitter(blockEmitter, this.rpc);
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
class TransactionCollector extends BaseIndexerModule.TransactionCollector {
  constructor(indexer, queryOptions, options) {
    super(indexer, queryOptions, options);
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
}

module.exports = {
  Indexer,
  CellCollector,
  TransactionCollector,
};
