import {
  Script,
  utils,
  Cell,
  BaseCellCollector,
  ScriptWrapper,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import { validators } from "ckb-js-toolkit";
import {
  AdditionalOptions,
  CkbQueryOptions,
  GetCellsResults,
  HexadecimalRange,
  Order,
  SearchFilter,
} from "./indexer";
import pLimit from "./third-party/pLimit";

import { CkbIndexer, ScriptType, SearchKey } from "./indexer";
export interface OtherQueryOptions {
  withBlockHash: true;
  rpc: RPC;
}
export class IndexerCollector implements BaseCellCollector {
  constructor(
    public indexer: CkbIndexer,
    public queries: CkbQueryOptions,
    public otherQueryOptions?: OtherQueryOptions
  ) {
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
  }

  private generatorSearchKey(queries: CkbQueryOptions): SearchKey {
    let script: Script | undefined = undefined;
    const filter: SearchFilter = {};
    let script_type: ScriptType | undefined = undefined;

    if (queries.lock) {
      script = queries.lock as Script;
      script_type = ScriptType.lock;
      if (queries.type && typeof queries.type !== "string") {
        filter.script = queries.type as Script;
      }
    } else if (queries.type && typeof queries.type !== "string") {
      script = queries.type as Script;
      script_type = ScriptType.type;
    }
    let block_range: HexadecimalRange | null = null;
    if (queries.fromBlock && queries.toBlock) {
      //toBlock+1 cause toBlock need to be included
      block_range = [
        queries.fromBlock,
        `0x${(BigInt(queries.toBlock) + 1n).toString(16)}`,
      ];
    }
    if (block_range) {
      filter.block_range = block_range;
    }
    if (queries.outputDataLenRange) {
      filter.output_data_len_range = queries.outputDataLenRange;
    }
    if (queries.outputCapacityRange) {
      filter.output_capacity_range = queries.outputCapacityRange;
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

  private async getLiveCell(lastCursor?: string): Promise<GetCellsResults> {
    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      additionalOptions.lastCursor = lastCursor;
    }
    const result: GetCellsResults = await this.indexer.getCells(
      this.generatorSearchKey(this.queries),
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

  async count() {
    let lastCursor: undefined | string = undefined;
    const getCellWithCursor = async (): Promise<Cell[]> => {
      const result: GetCellsResults = await this.getLiveCell(lastCursor);
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    let cells: Cell[] = await getCellWithCursor();
    if (cells.length === 0) {
      return 0;
    }
    let buffer: Promise<Cell[]> = getCellWithCursor();
    let index: number = 0;
    while (true) {
      if (!this.shouldSkipped(cells[index])) {
        counter += 1;
      }
      index++;
      //reset index and exchange `cells` and `buffer` after count last cell
      if (index === cells.length) {
        index = 0;
        cells = await buffer;
        // break if can not get more cells
        if (cells.length === 0) {
          break;
        }
        buffer = getCellWithCursor();
      }
    }
    return counter;
  }

  private async getLiveCellWithBlockHash(lastCursor?: string) {
    let result: GetCellsResults = await this.getLiveCell(lastCursor);
    const limit = pLimit(10);
    //TODO refine this functions type
    const inputs = result.objects.map((cell) => {
      return limit(() =>
        this.otherQueryOptions?.rpc.get_block_hash(cell.block_number as string)
      ) as Promise<string>;
    });
    const blockHashList: string[] = await Promise.all(inputs);
    result.objects = result.objects.map((item, index) => {
      const block_hash = blockHashList[index];
      return { ...item, block_hash };
    });
    return result;
  }

  async *collect() {
    const withBlockHash =
      this.otherQueryOptions &&
      "withBlockHash" in this.otherQueryOptions &&
      this.otherQueryOptions.withBlockHash;
    let lastCursor: undefined | string = undefined;
    const getCellWithCursor = async (): Promise<Cell[]> => {
      const result: GetCellsResults = await (withBlockHash
        ? this.getLiveCellWithBlockHash(lastCursor)
        : this.getLiveCell(lastCursor));
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let cells: Cell[] = await getCellWithCursor();
    if (cells.length === 0) {
      return;
    }
    let buffer: Promise<Cell[]> = getCellWithCursor();
    let index: number = 0;
    while (true) {
      if (!this.shouldSkipped(cells[index])) {
        yield cells[index];
      }
      index++;
      //reset index and exchange `cells` and `buffer` after yield last cell
      if (index === cells.length) {
        index = 0;
        cells = await buffer;
        // break if can not get more cells
        if (cells.length === 0) {
          break;
        }
        buffer = getCellWithCursor();
      }
    }
  }
}
