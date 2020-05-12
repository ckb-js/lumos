const { validators, RPC } = require("ckb-js-toolkit");
const { List, Set, is } = require("immutable");
const { CellCollector } = require("@ckb-lumos/indexer");
const { values } = require("@ckb-lumos/types");

class TransactionManager {
  constructor(indexer) {
    this.indexer = indexer;
    this.rpc = new RPC(indexer.uri);
    this.transactions = Set();
    this.spentCells = Set();
    this.createdCells = List();
  }

  // TODO: monitor network with the following 2 changes:
  // * A transaction is accepted on chain.
  // * A transaction is ruled out due to another transaction spends its input(s).
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
    const txHash = await rpc.send_transaction(tx);
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

  collector({ lock = null, type_ = null } = {}, { skipNotLive = false } = {}) {
    const innerCollector = new CellCollector(
      this.indexer,
      { lock, type_ },
      { skipNotLive }
    );
    const filteredCreatedCells = this.filteredCreatedCells.filter((cell) => {
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
