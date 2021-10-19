import { Script, utils, Cell } from "@ckb-lumos/base";
// import { logger } from "./logger";
import { CkbIndexer, ScriptType, SearchKey, Terminator } from "./indexer";

export abstract class Collector {
  abstract getCellsByLockscriptAndCapacity(
    lockscript: Script,
    capacity: bigint
  ): Promise<Cell[]>;
}

export class IndexerCollector extends Collector {
  constructor(public indexer: CkbIndexer) {
    super();
  }

  async getCellsByLockscriptAndCapacity(
    lockscript: Script,
    needCapacity: bigint
  ): Promise<Cell[]> {
    let accCapacity = 0n;
    const terminator: Terminator = (index, c) => {
      const cell = c;
      if (accCapacity >= needCapacity) {
        return { stop: true, push: false };
      }
      if (cell.data.length / 2 - 1 > 0 || cell.cell_output.type) {
        return { stop: false, push: false };
      } else {
        accCapacity += BigInt(cell.cell_output.capacity);
        return { stop: false, push: true };
      }
    };
    const searchKey = {
      script: lockscript,
      script_type: ScriptType.lock,
    };
    const cells = await this.indexer.getCells(searchKey, terminator);
    return cells;
  }

  async collectSudtByAmount(
    searchKey: SearchKey,
    amount: bigint
  ): Promise<Cell[]> {
    let balance = 0n;
    const terminator: Terminator = (index, c) => {
      const cell = c;
      if (balance >= amount) {
        return { stop: true, push: false };
      } else {
        const cellAmount = utils.readBigUInt128LE(cell.data);
        balance += cellAmount;
        return { stop: false, push: true };
      }
    };
    const cells = await this.indexer.getCells(searchKey, terminator);
    return cells;
  }

  async getBalance(lock: Script): Promise<bigint> {
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
    };
    const cells = await this.indexer.getCells(searchKey);
    let balance = 0n;
    cells.forEach((cell) => {
      balance += BigInt(cell.cell_output.capacity);
    });
    return balance;
  }

  async getSUDTBalance(sudtType: Script, userLock: Script): Promise<bigint> {
    const searchKey = {
      script: userLock,
      script_type: ScriptType.lock,
      filter: {
        script: sudtType,
      },
    };
    const cells = await this.indexer.getCells(searchKey);
    let balance = 0n;
    cells.forEach((cell) => {
      // logger.debug("cell.data:", cell.data);
      const amount = utils.readBigUInt128LE(cell.data);
      balance += amount;
    });
    return balance;
  }

  async getCellsByLockscriptAndCapacityWhenBurn(
    lockscript: Script,
    recipientTypeCodeHash: string,
    needCapacity: bigint
  ): Promise<Cell[]> {
    let accCapacity = 0n;
    const terminator: Terminator = (index, c) => {
      const cell = c;
      if (accCapacity >= needCapacity) {
        return { stop: true, push: false };
      }
      if (
        cell.cell_output.type &&
        cell.cell_output.type.code_hash === recipientTypeCodeHash
      ) {
        accCapacity += BigInt(cell.cell_output.capacity);
        return { stop: false, push: true };
      }
      if (cell.data.length / 2 - 1 > 0 || cell.cell_output.type !== undefined) {
        return { stop: false, push: false };
      } else {
        accCapacity += BigInt(cell.cell_output.capacity);
        return { stop: false, push: true };
      }
    };
    const searchKey = {
      script: lockscript,
      script_type: ScriptType.lock,
    };
    const cells = await this.indexer.getCells(searchKey, terminator);
    return cells;
  }
}
