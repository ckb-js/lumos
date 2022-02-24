const { validators, RPC } = require("@ckb-lumos/toolkit");
const { List, Set } = require("immutable");
const { values, helpers } = require("@ckb-lumos/base");
const { TransactionCollector } = require("@ckb-lumos/ckb-indexer");
const { isCellMatchQueryOptions } = helpers;

function defaultLogger(level, message) {
  console.log(`[${level}] ${message}`);
}

class TransactionManager {
  constructor(
    indexer,
    {
      logger = defaultLogger,
      pollIntervalSeconds = 30,
      rpc = new RPC(indexer.uri),
    } = {}
  ) {
    this.indexer = indexer;
    this.rpc = rpc;
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

  async _loopMonitor() {
    try {
      await this._checkTransactions();
    } catch (e) {
      this.logger("error", `Error checking transactions: ${e}`);
    }
    if (this.running) {
      setTimeout(() => this._loopMonitor(), this.pollIntervalSeconds * 1000);
    }
  }

  async _checkTransactions() {
    let filteredTransactions = Set();
    for await (let transactionValue of this.transactions) {
      /* Extract tx value from TransactionValue wrapper */
      let tx = transactionValue.value;
      /* First, remove all transactions that use already spent cells */
      for (const input of tx.inputs) {
        const cell = await this.rpc.get_live_cell(input.previous_output, false);
        if (!cell) {
          continue;
        }
      }
      /* Second, remove all transactions that have already been committed */
      const output = tx.outputs[0];
      if (output) {
        const transactionCollector = new TransactionCollector(this.indexer, {
          lock: output.lock,
        });
        const txHashes = await transactionCollector.getTransactionHashes();
        // remove witnesses property because it's redundant for calculating tx_hash
        delete tx.witnesses;
        const targetTxHash = new values.RawTransactionValue(tx, {
          validate: false,
        }).hash();
        if (txHashes.includes(targetTxHash)) {
          continue;
        }
      }
      filteredTransactions = filteredTransactions.add(transactionValue);
    }
    this.transactions = filteredTransactions;
    let createdCells = List();
    this.transactions.forEach((transactionValue) => {
      const tx = transactionValue.value;
      tx.outputs.forEach((output, i) => {
        const out_point = {
          tx_hash: tx.hash,
          index: "0x" + i.toString(16),
        };
        createdCells = createdCells.push({
          out_point,
          cell_output: output,
          data: tx.outputs_data[i],
          block_hash: null,
        });
      });
    });
    this.createdCells = createdCells;
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
    tx.hash = txHash;
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
      return isCellMatchQueryOptions(cell, {
        lock,
        type,
        argsLen,
        data,
      });
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
    const innerCollector = this.indexer.collector({
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
    this.spentCells = Set(spentCells);
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
      if (!this.spentCells.has(new values.OutPointValue(cell.out_point))) {
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
