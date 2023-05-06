import { Transaction, OutPoint, Cell, Hash } from "@ckb-lumos/base";
import { Promisable, Storage, createInMemoryStorage } from "./storage";

export type PendingCell = Pick<
  Required<Cell>,
  "outPoint" | "data" | "cellOutput"
>;

type TransactionWithHash = Required<Transaction>;

interface ManagerStorageScheme {
  transactions: TransactionWithHash[];
  spentCellOutpoints: OutPoint[];
  pendingCells: PendingCell[];
}

export interface TransactionStorage {
  getTransactions(): Promisable<TransactionWithHash[]>;
  setTransactions(transactions: TransactionWithHash[]): Promisable<void>;
  addTransaction(tx: TransactionWithHash): Promisable<void>;
  deleteTransactionByHash(txHash: Hash): Promisable<void>;

  // generated from pending transactions
  getPendingCells(): Promisable<PendingCell[]>;
  getSpentCellOutpoints(): Promisable<OutPoint[]>;
}

export class PendingTransactionStorage implements TransactionStorage {
  private storage: Storage<ManagerStorageScheme>;

  constructor(storage: Storage<ManagerStorageScheme>) {
    this.storage = storage;
  }

  async getTransactions(): Promise<TransactionWithHash[]> {
    return (await this.storage.getItem("transactions")) || [];
  }

  async setTransactions(transactions: TransactionWithHash[]): Promise<void> {
    await this.storage.setItem("transactions", transactions);
    await this.updatePendingCells();
  }

  async addTransaction(tx: TransactionWithHash): Promise<void> {
    const transactions = await this.getTransactions();
    await this.storage.setItem("transactions", transactions.concat(tx));
    await this.updatePendingCells();
  }

  async deleteTransactionByHash(txHash: Hash): Promise<void> {
    const transactions = await this.getTransactions();
    await this.storage.setItem(
      "transactions",
      transactions.filter((tx) => tx.hash !== txHash)
    );
    await this.updatePendingCells();
  }

  async getPendingCells(): Promise<PendingCell[]> {
    return (await this.storage.getItem("pendingCells")) || [];
  }

  async getSpentCellOutpoints(): Promise<OutPoint[]> {
    return (await this.storage.getItem("spentCellOutpoints")) || [];
  }

  private async updatePendingCells(): Promise<void> {
    const transactions = await this.getTransactions();

    const spentCellOutpoints = transactions
      .map((tx) => tx.inputs.map((input) => input.previousOutput))
      .flat();
    const pendingCells: PendingCell[] = transactions
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

    await this.storage.setItem("spentCellOutpoints", spentCellOutpoints);
    await this.storage.setItem("pendingCells", pendingCells);
  }
}

export function createInMemoryPendingTransactionStorage(): PendingTransactionStorage {
  return new PendingTransactionStorage(
    createInMemoryStorage<ManagerStorageScheme>()
  );
}
