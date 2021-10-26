import {
  Script,
  utils,
  Cell,
  BaseCellCollector,
  QueryOptions,
  ScriptWrapper,
  Hexadecimal,
} from "@ckb-lumos/base";
import { validators } from "ckb-js-toolkit";
import { OrderedSet } from "immutable";
import {
  AdditionalOptions,
  GetCellsResults,
  HexadecimalRange,
  Order,
  SearchFilter,
} from "./indexer";

// import { logger } from "./logger";
import { CkbIndexer, ScriptType, SearchKey, Terminator } from "./indexer";

export abstract class Collector {
  abstract getCellsByLockscriptAndCapacity(
    lockscript: Script,
    capacity: bigint
  ): Promise<Cell[]>;
}

export class IndexerCollector implements BaseCellCollector{
  lock!: Script;
  type!: Script | string;
  data: string | null;
  fromBlock: string | null;
  toBlock: string | null;
  order: Order;
  skip: number | null;
  argsLen: number | null;
  outputDataLenRange: HexadecimalRange | null;
  outputCapacityRange: HexadecimalRange | null;
  sizeLimit: number | undefined;

  constructor(public indexer: CkbIndexer, public queries: QueryOptions) {
    const {
      lock = null,
      type = null,
      argsLen = -1,
      data = "any",
      fromBlock = null,
      toBlock = null,
      order = Order.asc,
      skip = null,
      outputDataLenRange = null,
      outputCapacityRange = null,
      sizeLimit = undefined,
    } = queries;
    if (!lock && (!type || type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }

    function instanceOfScriptWrapper(object: any): object is ScriptWrapper {
      return "script" in object;
    }
    // unWrap `ScriptWrapper` into `Script`.
    if (lock) {
      if (!instanceOfScriptWrapper(lock)) {
        validators.ValidateScript(lock);
        this.lock = lock;
      } else if (instanceOfScriptWrapper(lock)) {
        validators.ValidateScript(lock.script);
        this.lock = lock.script;
      }
    }

    // unWrap `ScriptWrapper` into `Script`.
    if (type) {
      if (type === "empty") {
        this.type = "empty";
      }
      if (typeof type === "object" && !instanceOfScriptWrapper(type)) {
        validators.ValidateScript(type);
        this.type = type;
      } else if (typeof type === "object" && instanceOfScriptWrapper(type)) {
        validators.ValidateScript(type.script);
        this.type = type.script;
      }
    }

    if (fromBlock) {
      utils.assertHexadecimal("fromBlock", fromBlock);
    }
    if (toBlock) {
      utils.assertHexadecimal("toBlock", toBlock);
    }
    if (order !== Order.asc && order !== Order.desc) {
      throw new Error("Order must be either asc or desc!");
    }
    if (outputCapacityRange) {
      utils.assertHexadecimal("outputCapacityRange[0]", outputCapacityRange[0]);
      utils.assertHexadecimal("outputCapacityRange[1]", outputCapacityRange[1]);
    }

    if (outputDataLenRange) {
      utils.assertHexadecimal("outputDataLenRange[0]", outputDataLenRange[0]);
      utils.assertHexadecimal("outputDataLenRange[1]", outputDataLenRange[1]);
    }

    if (skip && typeof skip !== "number") {
      throw new Error("Skip must be a number!");
    }

    if (sizeLimit && typeof sizeLimit !== "number") {
      throw new Error("sizeLimit must be a number!");
    }

    this.indexer = indexer;
    this.data = data;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.order = order as Order;
    this.skip = skip;
    this.argsLen = argsLen as number;
    this.outputCapacityRange = outputCapacityRange;
    this.outputDataLenRange = outputDataLenRange;
    this.sizeLimit = sizeLimit;
  }

  //TODO check block number 64 or 128
  hexStringPlus(hexString: Hexadecimal, addend: number): Hexadecimal {
    const result = utils.readBigUInt128LE(hexString) + BigInt(addend);
    return utils.toBigUInt128LE(result);
  }
  generatorSearchKey(type: ScriptType): SearchKey {
    let script: Script | undefined = undefined;
    let script_type: ScriptType = type;
    const filter: SearchFilter = {};

    if (type === ScriptType.lock && this.lock) {
      filter.script = this.lock;
      script = this.lock;
    }
    if (
      type === ScriptType.type &&
      typeof this.type !== "string" &&
      this.type
    ) {
      filter.script = this.type;
      script = this.type;
    }
    let block_range: HexadecimalRange | null = null;
    if (this.fromBlock && this.toBlock) {
      //this.toBlock+1 cause toBlock need to be included
      block_range = [this.fromBlock, this.hexStringPlus(this.toBlock, 1)];
    }
    if (block_range) {
      filter.block_range = block_range;
    }
    if (this.outputDataLenRange) {
      filter.output_data_len_range = this.outputDataLenRange;
    }
    if (this.outputCapacityRange) {
      filter.output_capacity_range = this.outputCapacityRange;
    }
    if (!script) {
      throw new Error("Either lock or type script must be provided!");
    }
    return {
      script,
      script_type,
      filter,
    };
  }

  async getCellsToEnd(
    searchKey: SearchKey,
    additionalOptions: AdditionalOptions
  ): Promise<GetCellsResults> {
    let result = await this.indexer.getCells(
      searchKey,
      undefined,
      additionalOptions
    );
    while (true) {
      if (result.lastCursor !== additionalOptions.lastCursor) {
        const tempResult = await this.indexer.getCells(
          searchKey,
          undefined,
          additionalOptions
        );
        result.objects = result.objects.concat(tempResult.objects);
        result.lastCursor = tempResult.lastCursor;
      } else {
        break;
      }
    }
    return result;
  }

  async getLiveCell() {
    let lockOutPoints: OrderedSet<Cell> | null = null;
    let typeOutPoints: OrderedSet<Cell> | null = null;

    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.sizeLimit,
      order: this.order,
      lastCursor: undefined,
    };

    if (this.lock) {
      const result = await this.getCellsToEnd(
        this.generatorSearchKey(ScriptType.lock),
        additionalOptions
      );
      lockOutPoints = this.wrapOutPoints(result.objects);
    } else if (this.type && this.type !== "empty") {
      const result = await this.getCellsToEnd(
        this.generatorSearchKey(ScriptType.type),
        additionalOptions
      );
      typeOutPoints = this.wrapOutPoints(result.objects);
    }

    let outPoints: OrderedSet<Cell> = OrderedSet();
    if (lockOutPoints && typeOutPoints) {
      outPoints = lockOutPoints.intersect(typeOutPoints);
    } else if (lockOutPoints) {
      outPoints = lockOutPoints;
    } else if (typeOutPoints) {
      outPoints = typeOutPoints;
    }
    if (this.skip) {
      //TODO 判断outpoints的长度
      outPoints = outPoints.slice(this.skip);
    }
    return outPoints;
  }

  wrapOutPoints(outPoints: Cell[]) {
    let outPointsBufferValue: OrderedSet<Cell> = OrderedSet();
    for (const o of outPoints) {
      outPointsBufferValue = outPointsBufferValue.add(o);
    }
    return outPointsBufferValue;
  }

  getHexStringBytes(hexString: string) {
    return Math.ceil(hexString.substr(2).length / 2);
  }

  async count(): Promise<number> {
    let cells = await this.getLiveCell();
    let counter = 0;
    if (!cells) return counter;
    for (const cell of cells) {
      if (cell && this.type === "empty" && cell.cell_output.type) {
        continue;
      }
      if (this.data !== "any" && cell.data !== this.data) {
        continue;
      }
      if (
        this.argsLen !== -1 &&
        this.getHexStringBytes(cell.cell_output.lock.args) === this.argsLen
      ) {
        continue;
      }
      counter += 1;
    }

    return counter;
  }

  async *collect() {
    let cells = await this.getLiveCell();
    for (const cell of cells) {
      if (cell && this.type === "empty" && cell.cell_output.type) {
        continue;
      }
      if (this.data !== "any" && cell.data !== this.data) {
        continue;
      }
      if (
        this.argsLen !== -1 &&
        this.getHexStringBytes(cell.cell_output.lock.args) === this.argsLen
      ) {
        continue;
      }
      yield cell;
    }
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
    const result = await this.indexer.getCells(searchKey, terminator);
    return result.objects;
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
    const result = await this.indexer.getCells(searchKey, terminator);
    return result.objects;
  }

  async getBalance(lock: Script): Promise<bigint> {
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
    };
    const result = await this.indexer.getCells(searchKey);
    let balance = 0n;
    result.objects.forEach((cell) => {
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
    const result = await this.indexer.getCells(searchKey);
    let balance = 0n;
    result.objects.forEach((cell) => {
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
    const result = await this.indexer.getCells(searchKey, terminator);
    return result.objects;
  }
}
