const { validators, RPC } = require("ckb-js-toolkit");
const { List, Set, is } = require("immutable");
const { CellCollector } = require("@ckb-lumos/indexer");
const { values } = require("@ckb-lumos/base");
const { TransactionCollector } = require("@ckb-lumos/indexer/lib");

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

class TransactionManager {
  constructor(
    indexer,
    { logger = defaultLogger, pollIntervalSeconds = 30 } = {}
  ) {
    this.indexer = indexer;
    this.rpc = new RPC(indexer.uri);
    this.transactions = Set();
    this.spentCells = Set();
    this.createdCells = List();
    this.logger = logger;
    this.running = false;
    this.pollIntervalSeconds = pollIntervalSeconds;
  }

  // Start a monitor of network with the following 2 changes:
  // * A transaction is accepted on chain.
  // * A transaction is ruled out due to another transaction spends its input(s).
  // TODO: right now this works by polling the data periodically, later we might switch
  // to a notification based mechanism.
  start() {
    this.running = true;
    this._loopMonitor();
  }

  stop() {
    this.running = false;
  }

  _loopMonitor() {
    try {
      this._checkTransactions();
    } catch (e) {
      this.logger("error", `Error checking transactions: ${e}`);
    }
    if (this.running) {
      setTimeout(() => this._loopMonitor(), this.pollIntervalSeconds * 1000);
    }
  }

  _checkTransactions() {
    this.transactions = this.transactions.filter((tx) => {
      /* First, remove all transactions that use already spent cells */
      for (const input of tx.inputs) {
        const opBuffer = new values.OutPointValue(input.previous_output, {
          validate: false,
        }).buffer;
        const cell = this.indexer.nativeIndexer.getDetailedLiveCell(opBuffer);
        if (!cell) {
          return false;
        }
      }
      /* Second, remove all transactions that have already been committed */
      const output = tx.outputs[0];
      if (output) {
        const transactionCollector = new TransactionCollector(this.indexer, {
          lock: output.lock,
        });
        const txHashes = transactionCollector.getTransactionHashes();
        const targetTxHash = new values.TransactionValue(tx, {
          validate: false,
        }).hash();
        if (txHashes.includes(targetTxHash)) {
          return false;
        }
      }
      return true;
    });
  }

  async send_transaction(tx) {
    validators.ValidateTransaction(tx);
    tx.inputs.forEach((input) => {
      if (
        this.spentCells.includes(
          new values.OutPointValue(input.previous_output, { validate: false })
        )
      ) {
        throw new Error(
          `OutPoint ${input.previous_output.tx_hash}@${input.previous_output.index} has already been spent!`
        );
      }
    });
    const txHash = await this.rpc.send_transaction(tx);
    this.transactions = this.transactions.add(
      new values.TransactionValue(tx, { validate: false })
    );
    tx.inputs.forEach((input) => {
      this.spentCells = this.spentCells.add(
        new values.OutPointValue(input.previous_output, { validate: false })
      );
    });
    for (let i = 0; i < tx.outputs.length; i++) {
      const op = {
        tx_hash: txHash,
        index: `0x${i.toString(16)}`,
      };
      this.createdCells = this.createdCells.push({
        out_point: op,
        cell_output: tx.outputs[i],
        data: tx.outputs_data[i],
        block_hash: null,
      });
    }
    return txHash;
  }

  _filterCells(
    createdCells,
    { lock = null, type = null, argsLen = -1, data = "any" } = {}
  ) {
    const filteredCreatedCells = createdCells.filter((cell) => {
      if (lock && argsLen === -1) {
        if (
          !is(
            new values.ScriptValue(cell.cell_output.lock, { validate: false }),
            new values.ScriptValue(lock, { validate: false })
          )
        ) {
          return false;
        }
      }
      if (lock && argsLen >= 0) {
        const length = argsLen * 2 + 2;
        const lockArgsLength = lock.args.length;
        const minLength = Math.min(length, lockArgsLength);

        const cellLock = cell.cell_output.lock;
        if (cellLock.args.length !== length) {
          return false;
        }
        if (
          !(
            cellLock.code_hash === lock.code_hash &&
            cellLock.hash_type === lock.hash_type &&
            cellLock.args.slice(0, minLength) === lock.args.slice(0, minLength)
          )
        ) {
          return false;
        }
      }
      if (type && type === "empty" && cell.cell_output.type) {
        return false;
      }
      if (type && typeof type === "object") {
        if (
          !cell.cell_output.type ||
          !is(
            new values.ScriptValue(cell.cell_output.type, { validate: false }),
            new values.ScriptValue(type, { validate: false })
          )
        ) {
          return false;
        }
      }
      if (data && data !== "any" && cell.data !== data) {
        return false;
      }
      return true;
    });
    return filteredCreatedCells;
  }

  collector(
    {
      lock = null,
      type = null,
      argsLen = -1,
      data = "any",
      fromBlock = null,
      toBlock = null,
      skip = null,
    } = {},
    { usePendingOutputs = true } = {}
  ) {
    const params = [
      {
        name: "fromBlock",
        value: fromBlock,
      },
      {
        name: "toBlock",
        value: toBlock,
      },
      {
        name: "skip",
        value: skip,
      },
    ]
      .filter((param) => param.value != null)
      .map((param) => param.name);
    if (usePendingOutputs && params.length !== 0) {
      this.logger(
        "warn",
        params.map((param) => `\`${param}\``).join(", ") +
          " will not effect on pending cells."
      );
    }
    const innerCollector = new CellCollector(this.indexer, {
      lock,
      type,
      argsLen,
      data,
      fromBlock,
      toBlock,
      skip,
    });
    const filteredCreatedCells = this._filterCells(this.createdCells, {
      lock,
      type,
      argsLen,
      data,
    });
    return new TransactionManagerCellCollector(
      innerCollector,
      this.spentCells,
      filteredCreatedCells,
      { usePendingOutputs }
    );
  }
}

class TransactionManagerCellCollector {
  constructor(
    collector,
    spentCells,
    filteredCreatedCells,
    { usePendingOutputs = true } = {}
  ) {
    this.collector = collector;
    this.spentCells = spentCells;
    this.filteredCreatedCells = filteredCreatedCells;
    this.usePendingOutputs = usePendingOutputs;
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
    for await (const cell of this.collector.collect()) {
      if (!this.spentCells.includes(new values.OutPointValue(cell.out_point))) {
        yield cell;
      }
    }
    if (this.usePendingOutputs) {
      for (const cell of this.filteredCreatedCells) {
        yield cell;
      }
    }
  }
}

module.exports = TransactionManager;
