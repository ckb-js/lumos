const { validators, RPC } = require("ckb-js-toolkit");
const { List, Set, is } = require("immutable");
const { CellCollector } = require("@ckb-lumos/indexer");
const { values } = require("@ckb-lumos/base");

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

class TransactionManager {
  constructor(
    indexer,
    { logger = defaultLogger, pollIntervalSeconds = 30 } = { logger: defaultLogger, pollIntervalSeconds: 30 }
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
      setTimeout(this._loopMonitor, this.pollIntervalSeconds * 1000);
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
        const txHashes = this.indexer.getTransactionsByLockScript(output.lock, {
          validateFirst: false,
        });
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

  collector({ lock = null, type = null, argsLen = -1, data = "0x" } = {}) {
    const innerCollector = new CellCollector(this.indexer, {
      lock,
      type,
      argsLen,
      data,
    });
    const filteredCreatedCells = this.createdCells.filter((cell) => {
      if (lock) {
        if (
          !is(
            new values.ScriptValue(cell.cell_output.lock, { validate: false }),
            new values.ScriptValue(lock, { validate: false })
          )
        ) {
          return false;
        }
      }
      if (type_) {
        if (
          !cell.cell_output.type_ ||
          !is(
            new values.ScriptValue(cell.cell_output.type_, { validate: false }),
            new values.ScriptValue(type_, { validate: false })
          )
        ) {
          return false;
        }
      }
      return true;
    });
    return new TransactionManagerCellCollector(
      innerCollector,
      this.spentCells,
      filteredCreatedCells
    );
  }
}

class TransactionManagerCellCollector {
  constructor(collector, spentCells, filteredCreatedCells) {
    this.collector = collector;
    this.spentCells = spentCells;
    this.filteredCreatedCells = filteredCreatedCells;
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
    for (const cell of this.filteredCreatedCells) {
      yield cell;
    }
  }
}

module.exports = TransactionManager;
