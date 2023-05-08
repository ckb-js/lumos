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
import type { PendingCell, TransactionStorage } from "./TransactionStorage";
import { filterByLumosQueryOptions } from "@ckb-lumos/ckb-indexer/lib/ckbIndexerFilter";
import { Promisable } from "./storage";
import { CKBIndexerQueryOptions } from "@ckb-lumos/ckb-indexer/lib/type";
import { Indexer } from "@ckb-lumos/ckb-indexer";

type OutputsValidator = CKBComponents.OutputsValidator;

interface TransactionManager {
  sendTransaction(tx: Transaction): Promisable<string>;
  collector(
    queryOptions: CKBIndexerQueryOptions,
    usePendingCells?: boolean
  ): Promisable<CellCollector>;
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
  txStorage?: TransactionStorage;
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

export class TransactionsManager implements TransactionManager {
  private transactionSender: TransactionSender;
  private cellCollectorProvider: LumosCellIndexer;
  private txStorage: TransactionStorage;

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

  async removePendingCell(cell: Cell): Promise<boolean> {
    return await this.txStorage.deleteTransactionByCell(cell);
  }

  async collector(
    options: CKBIndexerQueryOptions,
    usePendingCells = true
  ): Promise<CellCollector> {
    const pendingCells: Cell[] = await this.txStorage.getPendingCells();
    // ignore skip here
    const optionsWithoutSkip = {
      ...options,
      skip: 0,
    };
    const filteredCreatedCells = filterByLumosQueryOptions(
      pendingCells,
      optionsWithoutSkip
    );
    const liveCellCollector =
      this.cellCollectorProvider.collector(optionsWithoutSkip);
    return new PendingCellCollector({
      spentCells: await this.txStorage.getSpentCellOutpoints(),
      filteredPendingCells: filteredCreatedCells as PendingCell[],
      usePendingCells,
      liveCellCollector,
      order: options.order,
      removePendingCell: this.removePendingCell,
    });
  }
}

class PendingCellCollector implements CellCollector {
  private spentCells: OutPoint[];
  private filteredPendingCells: PendingCell[];
  private liveCellCollector: CellCollector;
  private usePendingCells: boolean;
  private removePendingCell: (cell: Cell) => Promise<boolean>;
  /**
   * @param order - default to asc, return on-chain cells first, then pending cells, and vice versa
   */
  private order: "asc" | "desc";

  constructor(payload: {
    spentCells: OutPoint[];
    filteredPendingCells: PendingCell[];
    usePendingCells: boolean;
    liveCellCollector: CellCollector;
    removePendingCell: (cell: Cell) => Promise<boolean>;
    order?: "asc" | "desc";
  }) {
    const {
      spentCells,
      filteredPendingCells,
      usePendingCells,
      liveCellCollector,
      removePendingCell,
    } = payload;

    this.order = payload.order || "asc";
    this.spentCells = spentCells;
    this.filteredPendingCells =
      payload.order === "desc"
        ? filteredPendingCells.reverse()
        : filteredPendingCells;
    this.liveCellCollector = liveCellCollector;
    this.usePendingCells = usePendingCells;
    this.removePendingCell = removePendingCell;
  }

  private cellIsSpent(cell: Cell): boolean {
    return this.spentCells.some((spent) =>
      bytes.equal(
        blockchain.OutPoint.pack(spent),
        blockchain.OutPoint.pack(cell.outPoint!)
      )
    );
  }

  async *collect(): AsyncGenerator<Cell> {
    // order is desc, return pending cells first, then on-chain cells
    if (this.order === "desc") {
      if (this.usePendingCells) {
        for (const cell of this.filteredPendingCells) {
          if (!this.cellIsSpent(cell)) {
            yield cell;
          }
        }
      }
      for await (const cell of this.liveCellCollector.collect()) {
        const isPendingCell = await this.removePendingCell(cell);
        if (!this.cellIsSpent(cell) && !isPendingCell) {
          yield cell;
        }
      }
      // orser is asc, return on-chain cells first, then pending cells
    } else {
      for await (const cell of this.liveCellCollector.collect()) {
        await this.removePendingCell(cell);
        if (!this.cellIsSpent(cell)) {
          yield cell;
        }
      }
      if (this.usePendingCells) {
        for (const cell of this.filteredPendingCells) {
          if (!this.cellIsSpent(cell)) {
            yield cell;
          }
        }
      }
    }
  }
}
