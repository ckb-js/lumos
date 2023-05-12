import {
  blockchain,
  Transaction,
  OutPoint,
  Cell,
  CellCollector,
} from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { filterByLumosQueryOptions } from "@ckb-lumos/ckb-indexer/lib/ckbIndexerFilter";
import { TransactionStorage } from "./TransactionStorage";
import type { TransactionStorageType } from "./TransactionStorage";
import { createInMemoryStorage, Promisable, Store } from "./store";
import type { CKBIndexerQueryOptions } from "@ckb-lumos/ckb-indexer/lib/type";

interface TransactionManagerType {
  sendTransaction(tx: Transaction): Promisable<string>;
  collector(
    queryOptions: CKBIndexerQueryOptions,
    options?: { usePendingOutputs?: boolean }
  ): CellCollector;
  clearCache(): Promisable<void>;
}

interface TransactionSender {
  sendTransaction(tx: Transaction): Promisable<string>;
}

interface LumosCellIndexer {
  collector(options: CKBIndexerQueryOptions): CellCollector;
}

type ServiceProviders = {
  transactionSender: TransactionSender;
  indexer: LumosCellIndexer;
};

type ServiceEndPoint = {
  rpcUrl: string;
};

/**
 * `TransactionManager` offer a simple way to query and cache the pending transactions,
 * it means you can get the pending cells without waiting for the transaction to be confirmed.
 */
export class TransactionManager implements TransactionManagerType {
  private transactionSender: TransactionSender;
  private cellCollectorProvider: LumosCellIndexer;
  private txStorage: TransactionStorageType;

  constructor(payload: {
    transactionSender: TransactionSender;
    indexer: LumosCellIndexer;
    storage?: Store;
  }) {
    this.transactionSender = payload.transactionSender;
    this.cellCollectorProvider = payload.indexer;

    this.txStorage = new TransactionStorage(
      payload.storage || createInMemoryStorage()
    );
  }

  async clearCache(): Promise<void> {
    await this.txStorage.setTransactions([]);
  }

  async sendTransaction(tx: Transaction): Promise<string> {
    const txHash = await this.transactionSender.sendTransaction(tx);
    await this.txStorage.addTransaction({ ...tx, hash: txHash });
    return txHash;
  }

  /**
   * Similar to `ckbIndexer.collector`, but it will return the pending cells as well.
   * You can use `usePendingOutputs` to control whether to return the pending cells.
   * @param queryOptions
   * @param options
   */
  collector(
    queryOptions: CKBIndexerQueryOptions,
    options?: {
      /**
       * @default true
       */
      usePendingOutputs?: boolean;
    }
  ): CellCollector {
    const optionsWithoutSkip = {
      ...queryOptions,
      skip: 0,
    };
    const liveCellCollector =
      this.cellCollectorProvider.collector(optionsWithoutSkip);
    return new PendingCellCollector({
      txStorage: this.txStorage,
      queryOptions: optionsWithoutSkip,
      usePendingCells: options?.usePendingOutputs ?? true,
      liveCellCollector,
    });
  }
}

class PendingCellCollector implements CellCollector {
  private txStorage: TransactionStorageType;
  private queryOptions: CKBIndexerQueryOptions;
  private liveCellCollector: CellCollector;
  private usePendingCells: boolean;
  /**
   * @param order - default to asc, return on-chain cells first, then pending cells, and vice versa
   */
  private order: "asc" | "desc";

  constructor(payload: {
    txStorage: TransactionStorageType;
    queryOptions: CKBIndexerQueryOptions;
    liveCellCollector: CellCollector;
    usePendingCells: boolean;
  }) {
    const { queryOptions, liveCellCollector, txStorage, usePendingCells } =
      payload;

    this.order = queryOptions.order === "desc" ? "desc" : "asc";
    this.liveCellCollector = liveCellCollector;
    this.usePendingCells = usePendingCells;
    this.txStorage = txStorage;
    this.queryOptions = queryOptions;
  }

  private async removePendingCell(cell: Cell): Promise<boolean> {
    return this.txStorage.deleteTransactionByCell(cell);
  }

  private cellIsSpent(cell: Cell, spentCells: OutPoint[]): boolean {
    return spentCells.some((spent) =>
      bytes.equal(
        blockchain.OutPoint.pack(spent),
        blockchain.OutPoint.pack(cell.outPoint!)
      )
    );
  }

  async *collect(): AsyncGenerator<Cell> {
    const pendingCells: Cell[] = await this.txStorage.getPendingCells();
    const spentCells: OutPoint[] = await this.txStorage.getSpentCellOutpoints();
    const filteredPendingCells = filterByLumosQueryOptions(
      pendingCells,
      this.queryOptions
    );
    // order is desc, return pending cells first, then on-chain cells
    if (this.order === "desc") {
      if (this.usePendingCells) {
        for (const cell of filteredPendingCells) {
          if (!this.cellIsSpent(cell, spentCells)) {
            yield cell;
          }
        }
      }
      for await (const cell of this.liveCellCollector.collect()) {
        const isPendingCell = await this.removePendingCell(cell);
        if (!this.cellIsSpent(cell, spentCells) && !isPendingCell) {
          yield cell;
        }
      }
      // orser is asc, return on-chain cells first, then pending cells
    } else {
      for await (const cell of this.liveCellCollector.collect()) {
        await this.removePendingCell(cell);
        if (!this.cellIsSpent(cell, spentCells)) {
          yield cell;
        }
      }
      if (this.usePendingCells) {
        for (const cell of filteredPendingCells) {
          if (!this.cellIsSpent(cell, spentCells)) {
            yield cell;
          }
        }
      }
    }
  }
}
