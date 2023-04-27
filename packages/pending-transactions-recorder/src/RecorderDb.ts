import { Transaction, OutPoint, Cell } from "@ckb-lumos/base";

export type PendingCell = Pick<
  Required<Cell>,
  "outPoint" | "data" | "cellOutput"
>;

export interface RecorderStorageScheme {
  transactions: Transaction[];
  spentCellOutpoints: OutPoint[];
  pendingCells: PendingCell[];
}

export interface RecorderDb {
  getTransactions(): Promise<Transaction[]>;
  setTransactions(transactions: Transaction[]): Promise<void>;
  addTransaction(tx: Transaction): Promise<void>;

  getPendingCells(): Promise<PendingCell[]>;
  setPendingCells(cells: PendingCell[]): Promise<void>;
  addPendingCell(cell: Cell): Promise<void>;

  getSpentCellOutpoints(): Promise<OutPoint[]>;
  setSpentCellOutpoints(outpoints: OutPoint[]): Promise<void>;
  addSpentCellOutpoint(outpoint: OutPoint): Promise<void>;
}

export class InMemoryRecorderDb implements RecorderDb {
  transactions: Transaction[];
  spentCellOutpoints: OutPoint[];
  pendingCells: PendingCell[];

  constructor() {
    this.transactions = [];
    this.spentCellOutpoints = [];
    this.pendingCells = [];
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.transactions;
  }

  async setTransactions(transactions: Transaction[]): Promise<void> {
    this.transactions = transactions;
  }

  async addTransaction(tx: Transaction): Promise<void> {
    this.transactions.push(tx);
  }

  async getPendingCells(): Promise<PendingCell[]> {
    return this.pendingCells;
  }

  async setPendingCells(cells: PendingCell[]): Promise<void> {
    this.pendingCells = cells;
  }

  async addPendingCell(cell: PendingCell): Promise<void> {
    this.pendingCells.push(cell);
  }

  async getSpentCellOutpoints(): Promise<OutPoint[]> {
    return this.spentCellOutpoints;
  }

  async setSpentCellOutpoints(outpoints: OutPoint[]): Promise<void> {
    this.spentCellOutpoints = outpoints;
  }

  async addSpentCellOutpoint(outpoint: OutPoint): Promise<void> {
    this.spentCellOutpoints.push(outpoint);
  }
}
