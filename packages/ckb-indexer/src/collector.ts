import {
  Script,
  utils,
  Cell,
  BaseCellCollector,
  ScriptWrapper,
} from "@ckb-lumos/base";
import { validators } from "ckb-js-toolkit";
import {
  AdditionalOptions,
  CkbQueryOptions,
  GetCellsResults,
  HexadecimalRange,
  Order,
  SearchFilter,
} from "./indexer";

import { CkbIndexer, ScriptType, SearchKey } from "./indexer";

export class IndexerCollector implements BaseCellCollector {
  constructor(public indexer: CkbIndexer, public queries: CkbQueryOptions) {
    const defaultQuery: CkbQueryOptions = {
      lock: undefined,
      type: undefined,
      argsLen: -1,
      data: "any",
      fromBlock: undefined,
      toBlock: undefined,
      order: Order.asc,
      skip: undefined,
      outputDataLenRange: undefined,
      outputCapacityRange: undefined,
      bufferSize: undefined,
    };
    this.queries = { ...defaultQuery, ...this.queries };
    if (
      !this.queries.lock &&
      (!this.queries.type || this.queries.type === "empty")
    ) {
      throw new Error("Either lock or type script must be provided!");
    }

    function instanceOfScriptWrapper(object: unknown): object is ScriptWrapper {
      return typeof object === "object" && object != null && "script" in object;
    }

    // unWrap `ScriptWrapper` into `Script`.
    if (this.queries.lock) {
      if (!instanceOfScriptWrapper(this.queries.lock)) {
        validators.ValidateScript(this.queries.lock);
      } else if (instanceOfScriptWrapper(this.queries.lock)) {
        validators.ValidateScript(this.queries.lock.script);
        this.queries.lock = this.queries.lock.script;
      }
    }

    // unWrap `ScriptWrapper` into `Script`.
    if (this.queries.type && this.queries.type !== "empty") {
      if (
        typeof this.queries.type === "object" &&
        !instanceOfScriptWrapper(this.queries.type)
      ) {
        validators.ValidateScript(this.queries.type);
      } else if (
        typeof this.queries.type === "object" &&
        instanceOfScriptWrapper(this.queries.type)
      ) {
        validators.ValidateScript(this.queries.type.script);
        this.queries.type = this.queries.type.script;
      }
    }

    if (this.queries.fromBlock) {
      utils.assertHexadecimal("fromBlock", this.queries.fromBlock);
    }
    if (this.queries.toBlock) {
      utils.assertHexadecimal("toBlock", this.queries.toBlock);
    }
    if (this.queries.order !== Order.asc && this.queries.order !== Order.desc) {
      throw new Error("Order must be either asc or desc!");
    }
    if (this.queries.outputCapacityRange) {
      utils.assertHexadecimal(
        "outputCapacityRange[0]",
        this.queries.outputCapacityRange[0]
      );
      utils.assertHexadecimal(
        "outputCapacityRange[1]",
        this.queries.outputCapacityRange[1]
      );
    }

    if (this.queries.outputDataLenRange) {
      utils.assertHexadecimal(
        "outputDataLenRange[0]",
        this.queries.outputDataLenRange[0]
      );
      utils.assertHexadecimal(
        "outputDataLenRange[1]",
        this.queries.outputDataLenRange[1]
      );
    }

    if (this.queries.skip && typeof this.queries.skip !== "number") {
      throw new Error("skip must be a number!");
    }

    if (
      this.queries.bufferSize &&
      typeof this.queries.bufferSize !== "number"
    ) {
      throw new Error("bufferSize must be a number!");
    }
    this.indexer = indexer;
  }

  //TODO change to input QueryOption type and return SearchKey Type
  private generatorSearchKey(): SearchKey {
    let script: Script | undefined = undefined;
    const filter: SearchFilter = {};
    let script_type: ScriptType | undefined = undefined;

    if (this.queries.lock) {
      script = this.queries.lock as Script;
      script_type = ScriptType.lock;
      if (this.queries.type && typeof this.queries.type !== "string") {
        filter.script = this.queries.type as Script;
      }
    } else if (this.queries.type && typeof this.queries.type !== "string") {
      script = this.queries.type as Script;
      script_type = ScriptType.type;
    }
    let block_range: HexadecimalRange | null = null;
    if (this.queries.fromBlock && this.queries.toBlock) {
      //this.toBlock+1 cause toBlock need to be included
      block_range = [
        this.queries.fromBlock,
        `0x${(BigInt(this.queries.toBlock) + 1n).toString(16)}`,
      ];
    }
    if (block_range) {
      filter.block_range = block_range;
    }
    if (this.queries.outputDataLenRange) {
      filter.output_data_len_range = this.queries.outputDataLenRange;
    }
    if (this.queries.outputCapacityRange) {
      filter.output_capacity_range = this.queries.outputCapacityRange;
    }
    if (!script) {
      throw new Error("Either lock or type script must be provided!");
    }
    if (!script_type) {
      throw new Error("script_type must be provided");
    }
    return {
      script,
      script_type,
      filter,
    };
  }

  //TODO get block_hash
  private async getLiveCell(lastCursor?: string): Promise<GetCellsResults> {
    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      additionalOptions.lastCursor = lastCursor;
    }
    const result: GetCellsResults = await this.indexer.getCells(
      this.generatorSearchKey(),
      undefined,
      additionalOptions
    );

    if (this.queries.skip) {
      result.objects = result.objects.slice(this.queries.skip);
    }
    return result;
  }

  private getHexStringBytes(hexString: string) {
    return Math.ceil(hexString.substr(2).length / 2);
  }

  private shouldSkipped(cell: Cell) {
    if (cell && this.queries.type === "empty" && cell.cell_output.type) {
      return true;
    }
    if (this.queries.data !== "any" && cell.data !== this.queries.data) {
      return true;
    }
    if (
      this.queries.argsLen !== -1 &&
      this.queries.argsLen !== "any" &&
      this.getHexStringBytes(cell.cell_output.lock.args) !==
        this.queries.argsLen
    ) {
      return true;
    }
  }

  async count(): Promise<number> {
    let result: GetCellsResults = await this.getLiveCell();
    let lastCursor = result.lastCursor;
    let objects = result.objects;
    let resultLength = objects.length;
    let counter = 0;
    for (let i = 0; i < resultLength; i++) {
      if (i === resultLength - 1) {
        result = await this.getLiveCell(lastCursor);
        lastCursor = result.lastCursor;
        objects = objects.concat(result.objects);
        resultLength = objects.length;
      }
      const cell = objects[i];
      if (this.shouldSkipped(cell)) {
        continue;
      }
      counter += 1;
    }

    return counter;
  }

  //TODO change not to concat array cause GC
  async *collect() {
    let result: GetCellsResults = await this.getLiveCell();
    let lastCursor = result.lastCursor;
    let objects = result.objects;
    let resultLength = objects.length;
    for (let i = 0; i < resultLength; i++) {
      if (i === resultLength - 1) {
        result = await this.getLiveCell(lastCursor);
        lastCursor = result.lastCursor;
        objects = objects.concat(result.objects);
        resultLength = objects.length;
      }
      const cell = objects[i];
      if (this.shouldSkipped(objects[i])) {
        continue;
      }
      yield cell;
    }
  }
}
