import { Set } from "immutable";
import {
  blockchain,
  Transaction,
  Script,
  utils,
  OutPoint,
  Cell,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import isEqual from "lodash.isequal";
import { bytes } from "@ckb-lumos/codec";
import { RecorderDb, PendingCell } from "./RecorderDb";
import {
  CkbIndexerFilterOptions,
  filterByIndexerFilterProtocol,
} from "@ckb-lumos/ckb-indexer/lib/ckbIndexerFilter";

const getTxHashesByLocks = async (
  lock: Script,
  rpc: RPC
): Promise<String[]> => {
  // TODO: set limit to 100, at most 100 pending transactions on a lock
  const reponse = await rpc.getTransactions(
    { script: lock, scriptType: "lock" },
    "asc",
    "0x64"
  );
  return reponse.objects.map((res) => res.txHash);
};

interface TransactionManager {
  stop(): void;
  sendTransaction(tx: Transaction): Promise<string>;
  getCells(locks: Script[]): Promise<PendingCell[]>;
  filterSpentCells(cells: PendingCell[]): Promise<PendingCell[]>;
}

type Props = {
  rpcUrl: string;
  txRecorderDb: RecorderDb;
  options?: {
    pollIntervalSeconds?: number;
  };
};

export class DefaultTransactionManager implements TransactionManager {
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

  async getCells(locks: Script[]): Promise<PendingCell[]> {
    const cells = await this.txRecorderDb.getPendingCells();
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

  async filterSpentCells(cells: PendingCell[]): Promise<PendingCell[]> {
    const spentCellOutpoints = await this.txRecorderDb.getSpentCellOutpoints();
    console.log(
      "filterring spent cells, spent:",
      spentCellOutpoints,
      "cells:",
      cells.map((cell) => cell.outPoint)
    );
    return cells.filter(
      (cell) =>
        !!cell.outPoint &&
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
    let filteredTransactions = Set<Transaction>();
    const txs = await this.txRecorderDb.getTransactions();
    for await (let tx of txs) {
      /* remove all transactions that have already been committed */
      const output = tx.outputs[0];
      if (output) {
        const txHashes = await getTxHashesByLocks(output.lock, this.rpc);
        console.log("txHashes", txHashes, "from lock:", output.lock, "deteted");
        const targetTxHash = utils.ckbHash(blockchain.RawTransaction.pack(tx));
        if (txHashes.includes(targetTxHash)) {
          continue;
        }
      }
      filteredTransactions = filteredTransactions.add(tx);
    }
    await this.txRecorderDb.setTransactions(filteredTransactions.toArray());
    const updatePendingCells = filteredTransactions.map((transactionValue) => {
      const tx = transactionValue;
      tx.outputs.forEach((output, i) => {
        const outPoint = {
          txHash: tx.hash!,
          index: "0x" + i.toString(16),
        };
        this.txRecorderDb.addPendingCell({
          outPoint,
          cellOutput: output,
          data: tx.outputsData[i],
        });
      });
    });
    await Promise.all(updatePendingCells);
  }

  async sendTransaction(tx: Transaction): Promise<string> {
    // check if the input tx is valid
    blockchain.Transaction.pack(tx);
    const spentCellOutpoints = await this.txRecorderDb.getSpentCellOutpoints();
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
    tx.hash = txHash;
    await this.txRecorderDb.addTransaction(tx);
    const addSpentCells = tx.inputs.map((input) => {
      return this.txRecorderDb.addSpentCellOutpoint(input.previousOutput);
    });
    await Promise.all(addSpentCells);

    for (let i = 0; i < tx.outputs.length; i++) {
      const op = {
        txHash: txHash,
        index: `0x${i.toString(16)}`,
      };
      await this.txRecorderDb.addPendingCell({
        outPoint: op,
        cellOutput: tx.outputs[i],
        data: tx.outputsData[i],
      });
    }
    return txHash;
  }

  async collector(options: CkbIndexerFilterOptions): Promise<PendingCellCollector> {
    const pendingCells: Cell[] = await this.txRecorderDb.getPendingCells();

    const filteredCreatedCells = filterByIndexerFilterProtocol({
      cells: pendingCells,
      params: options,
    });

    return new PendingCellCollector(
      await this.txRecorderDb.getSpentCellOutpoints(),
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
