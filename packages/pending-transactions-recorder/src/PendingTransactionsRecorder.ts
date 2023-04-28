import {
  blockchain,
  Transaction,
  Script,
  utils,
  OutPoint,
  Cell,
  Hash,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import isEqual from "lodash.isequal";
import { bytes } from "@ckb-lumos/codec";
import { RecorderDb, PendingCell } from "./RecorderDb";
import {
  CkbIndexerFilterOptions,
  filterByIndexerFilterProtocol,
} from "@ckb-lumos/ckb-indexer/lib/ckbIndexerFilter";

// https://github.com/nervosnetwork/ckb/blob/develop/rpc/README.md#type-status
type TRANSACTION_STATUS =
  | "pending"
  | "proposed"
  | "committed"
  | "unknown"
  | "rejected";

// TODO: batch get transactions
const isTxCompleted = async (txHash: Hash, rpc: RPC): Promise<boolean> => {
  const reponse = await rpc.getTransaction(txHash);
  return txStatusIsCompleted(reponse.txStatus.status as TRANSACTION_STATUS);
};

const txStatusIsCompleted = (txStatus: TRANSACTION_STATUS): boolean =>
  txStatus === "committed" || txStatus === "rejected";

interface TransactionRecorder {
  stop(): void;
  sendTransaction(tx: Transaction): Promise<string>;
  getCells(locks: Script[]): Cell[];
  filterSpentCells(cells: Cell[]): Cell[];
}

type Props = {
  rpcUrl: string;
  txRecorderDb: RecorderDb;
  options?: {
    pollIntervalSeconds?: number;
  };
};

export class PendingTransactionsRecorder implements TransactionRecorder {
  running: boolean;
  pollIntervalSeconds: number;
  rpc: RPC;
  txRecorderDb: RecorderDb;
  constructor(payload: Props) {
    this.rpc = new RPC(payload.rpcUrl);
    this.running = false;
    this.pollIntervalSeconds = payload?.options?.pollIntervalSeconds || 10;
    this.txRecorderDb = payload.txRecorderDb;

    void this.start();
  }

  getCells(locks: Script[]): Cell[] {
    const cells = this.txRecorderDb.getPendingCells();
    const createdCells = cells.filter((cell) =>
      locks.some((lock) =>
        isEqual(
          utils.computeScriptHash(cell.cellOutput.lock),
          utils.computeScriptHash(lock)
        )
      )
    );
    return this.filterSpentCells(createdCells);
  }

  filterSpentCells(cells: Cell[]): Cell[] {
    const spentCellOutpoints = this.txRecorderDb.getSpentCellOutpoints();
    console.log(
      "filterring spent cells, spent:",
      spentCellOutpoints,
      "cells:",
      cells.map((cell) => cell.outPoint)
    );
    return cells.filter(
      (cell) =>
        !cell.outPoint ||
        !spentCellOutpoints.some((outpoint) =>
          bytes.equal(
            blockchain.OutPoint.pack(outpoint),
            blockchain.OutPoint.pack(cell.outPoint!)
          )
        )
    );
  }

  private start(): void {
    this.running = true;
    void this.watchPendingTransactions();
  }

  stop(): void {
    this.running = false;
  }

  private async watchPendingTransactions(): Promise<void> {
    try {
      await this.updatePendingTransactions();
    } catch (e) {
      console.error(e);
    }
    if (this.running) {
      setTimeout(
        () => this.watchPendingTransactions(),
        this.pollIntervalSeconds * 1000
      );
    }
  }

  private async updatePendingTransactions(): Promise<void> {
    const txs = this.txRecorderDb.getTransactions();
    for await (const tx of txs) {
      /* remove all transactions that have already been completed */
      const txCompleted = await isTxCompleted(tx.hash, this.rpc);
      if (txCompleted) {
        this.txRecorderDb.deleteTransactionByHash(tx.hash);
        console.log("tx: ", tx.hash, " is deteted");
      }
    }
  }

  async sendTransaction(tx: Transaction): Promise<string> {
    // check if the input tx is valid
    blockchain.Transaction.pack(tx);
    const spentCellOutpoints = this.txRecorderDb.getSpentCellOutpoints();
    tx.inputs.forEach((input) => {
      if (
        spentCellOutpoints.some((spentCell) =>
          bytes.equal(
            blockchain.OutPoint.pack(spentCell),
            blockchain.OutPoint.pack(input.previousOutput)
          )
        )
      ) {
        throw new Error(
          `OutPoint ${input.previousOutput.txHash}@${input.previousOutput.index} has already been spent!`
        );
      }
    });
    const txHash = await this.rpc.sendTransaction(tx);
    this.txRecorderDb.addTransaction({ ...tx, hash: txHash });
    return txHash;
  }

  collector(options: CkbIndexerFilterOptions): PendingCellCollector {
    const pendingCells: Cell[] = this.txRecorderDb.getPendingCells();

    const filteredCreatedCells = filterByIndexerFilterProtocol({
      cells: pendingCells,
      params: options,
    });

    return new PendingCellCollector(
      this.txRecorderDb.getSpentCellOutpoints(),
      filteredCreatedCells as PendingCell[]
    );
  }
}

class PendingCellCollector {
  spentCells: OutPoint[];
  filteredPendingCells: PendingCell[];
  constructor(spentCells: OutPoint[], filteredPendingCells: PendingCell[]) {
    this.spentCells = spentCells;
    this.filteredPendingCells = filteredPendingCells;
  }

  getUnspentPendingCells(): PendingCell[] {
    return this.filteredPendingCells.filter((cell) => {
      return !this.spentCells.some((spentCell) => {
        bytes.equal(
          blockchain.OutPoint.pack(cell.outPoint),
          blockchain.OutPoint.pack(spentCell)
        );
      });
    });
  }

  count() {
    return this.getUnspentPendingCells().length;
  }

  *collect() {
    for (const cell of this.filteredPendingCells) {
      yield cell;
    }
  }
}
