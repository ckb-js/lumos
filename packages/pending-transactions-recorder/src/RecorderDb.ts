import { Transaction, OutPoint, Cell, Hash } from "@ckb-lumos/base";

export type PendingCell = Pick<
  Required<Cell>,
  "outPoint" | "data" | "cellOutput"
>;

type TransactionWithHash = Required<Transaction>;

export interface RecorderStorageScheme {
  transactions: TransactionWithHash[];
  spentCellOutpoints: OutPoint[];
  pendingCells: PendingCell[];
}

export interface RecorderDb {
  getTransactions(): TransactionWithHash[];
  setTransactions(transactions: TransactionWithHash[]): void;
  addTransaction(tx: TransactionWithHash): void;
  deleteTransactionByHash(txHash: Hash): void;

  // generated from pending transactions
  getPendingCells(): PendingCell[];
  getSpentCellOutpoints(): OutPoint[];
}

export class InMemoryRecorderDb implements RecorderDb {
  private transactions: TransactionWithHash[];
  private spentCellOutpoints: OutPoint[];
  private pendingCells: PendingCell[];

  constructor() {
    this.transactions = [];
    this.spentCellOutpoints = [];
    this.pendingCells = [];
  }

  getTransactions(): TransactionWithHash[] {
    return this.transactions;
  }

  setTransactions(transactions: TransactionWithHash[]): void {
    this.transactions = transactions;
    this.updatePendingCells();
  }

  addTransaction(tx: TransactionWithHash): void {
    this.transactions.push(tx);
    this.updatePendingCells();
  }

  deleteTransactionByHash(txHash: Hash): void {
    this.transactions.filter((tx) => tx.hash !== txHash);
    this.updatePendingCells();
  }

  getPendingCells(): PendingCell[] {
    return this.pendingCells;
  }

  getSpentCellOutpoints(): OutPoint[] {
    return this.spentCellOutpoints;
  }

  private updatePendingCells(): void {
    const spentCellOutpoints = this.transactions
      .map((tx) => tx.inputs.map((input) => input.previousOutput))
      .flat();
    const pendingCells: PendingCell[] = this.transactions
      .map((tx) =>
        tx.outputs.map((output, index) => ({
          outPoint: {
            txHash: tx.hash,
            index: "0x" + index.toString(16),
          },
          cellOutput: output,
          data: tx.outputsData[index],
        }))
      )
      .flat();

    this.spentCellOutpoints = spentCellOutpoints;
    this.pendingCells = pendingCells;
  }
}
