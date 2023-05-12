import {
  blockchain,
  Transaction,
  OutPoint,
  Cell,
  CellCollector,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import { bytes } from "@ckb-lumos/codec";
import type { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";
import { createInMemoryPendingTransactionStorage } from "./TransactionStorage";
import type { TransactionStorageType } from "./TransactionStorage";
import { filterByLumosQueryOptions } from "@ckb-lumos/ckb-indexer/lib/ckbIndexerFilter";
import { Promisable } from "./storage";
import { CKBIndexerQueryOptions } from "@ckb-lumos/ckb-indexer/lib/type";
import { Indexer } from "@ckb-lumos/ckb-indexer";

type OutputsValidator = CKBComponents.OutputsValidator;

interface TransactionManagerType {
  sendTransaction(tx: Transaction): Promisable<string>;
  collector(
    queryOptions: CKBIndexerQueryOptions,
    options?: { usePendingOutputs?: boolean }
  ): CellCollector;
  clearCache(): Promisable<void>;
}

interface TransactionSender {
  sendTransaction(
    tx: Transaction,
    outputsValidator?: "passthrough" | "default"
  ): Promisable<string>;
}

interface LumosCellIndexer {
  collector(options: CKBIndexerQueryOptions): CellCollector;
}

type Options = {
  pollIntervalSeconds?: number;
  // default to in memory storage
  txStorage?: TransactionStorageType;
};

type ServiceProviders = {
  transactionSender: TransactionSender;
  cellCollectorProvider: LumosCellIndexer;
};

type ServiceEndPoint = {
  rpcUrl: string;
};

function isServiceEndPoint(
  providers: ServiceEndPoint | ServiceProviders
): providers is ServiceEndPoint {
  return typeof providers === "object" && "rpcUrl" in providers;
}

export class TransactionManager implements TransactionManagerType {
  private transactionSender: TransactionSender;
  private cellCollectorProvider: LumosCellIndexer;
  private txStorage: TransactionStorageType;

  constructor(payload: {
    providers: ServiceEndPoint | ServiceProviders;
    options?: Options;
  }) {
    if (isServiceEndPoint(payload.providers)) {
      const { rpcUrl } = payload.providers;

      this.transactionSender = new RPC(rpcUrl);
      this.cellCollectorProvider = new Indexer(rpcUrl);
    } else {
      const { transactionSender, cellCollectorProvider } = payload.providers;

      this.transactionSender = transactionSender;
      this.cellCollectorProvider = cellCollectorProvider;
    }

    this.txStorage =
      payload.options?.txStorage || createInMemoryPendingTransactionStorage();
  }

  async clearCache(): Promise<void> {
    await this.txStorage.setTransactions([]);
  }

  async sendTransaction(
    tx: Transaction,
    validator: OutputsValidator = "passthrough"
  ): Promise<string> {
    const txHash = await this.transactionSender.sendTransaction(tx, validator);
    await this.txStorage.addTransaction({ ...tx, hash: txHash });
    return txHash;
  }

  collector(
    queryOptions: CKBIndexerQueryOptions,
    options?: { usePendingOutputs?: boolean }
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
      usePendingCells: options?.usePendingOutputs === false ? false : true,
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
    return await this.txStorage.deleteTransactionByCell(cell);
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
