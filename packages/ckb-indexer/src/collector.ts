import { utils, Cell, BaseCellCollector } from "@ckb-lumos/base";
import { validators } from "@ckb-lumos/toolkit";
import {
  SearchKeyFilter,
  CKBIndexerQueryOptions,
  GetCellsResults,
  Order,
  OtherQueryOptions,
} from "./type";

import { CkbIndexer } from "./indexer";
import {
  generateSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
} from "./services";
import fetch from "cross-fetch";

interface GetBlockHashRPCResult {
  jsonrpc: string;
  id: number;
  result: string;
}

/** CellCollector will not get cell with block_hash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get block_hash if you need. */
export class CKBCellCollector implements BaseCellCollector {
  constructor(
    public indexer: CkbIndexer,
    public queries: CKBIndexerQueryOptions,
    public otherQueryOptions?: OtherQueryOptions
  ) {
    const defaultQuery: CKBIndexerQueryOptions = {
      lock: undefined,
      type: undefined,
      argsLen: -1,
      data: "any",
      fromBlock: undefined,
      toBlock: undefined,
      order: "asc",
      skip: undefined,
      outputDataLenRange: undefined,
      outputCapacityRange: undefined,
      bufferSize: undefined,
    };
    this.queries = { ...defaultQuery, ...this.queries };
    this.validateParams(this.queries);
    this.convertParams();
  }

  public validateParams(queries: CKBIndexerQueryOptions): void {
    if (!queries.lock && (!queries.type || queries.type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }

    if (queries.lock) {
      if (!instanceOfScriptWrapper(queries.lock)) {
        validators.ValidateScript(queries.lock);
      } else if (instanceOfScriptWrapper(queries.lock)) {
        validators.ValidateScript(queries.lock.script);
      }
    }

    if (queries.type && queries.type !== "empty") {
      if (
        typeof queries.type === "object" &&
        !instanceOfScriptWrapper(queries.type)
      ) {
        validators.ValidateScript(queries.type);
      } else if (
        typeof queries.type === "object" &&
        instanceOfScriptWrapper(queries.type)
      ) {
        validators.ValidateScript(queries.type.script);
      }
    }

    if (queries.fromBlock) {
      utils.assertHexadecimal("fromBlock", queries.fromBlock);
    }
    if (queries.toBlock) {
      utils.assertHexadecimal("toBlock", queries.toBlock);
    }
    if (queries.order !== "asc" && queries.order !== "desc") {
      throw new Error("Order must be either asc or desc!");
    }
    if (queries.outputCapacityRange) {
      utils.assertHexadecimal(
        "outputCapacityRange[0]",
        queries.outputCapacityRange[0]
      );
      utils.assertHexadecimal(
        "outputCapacityRange[1]",
        queries.outputCapacityRange[1]
      );
    }

    if (queries.outputDataLenRange) {
      utils.assertHexadecimal(
        "outputDataLenRange[0]",
        queries.outputDataLenRange[0]
      );
      utils.assertHexadecimal(
        "outputDataLenRange[1]",
        queries.outputDataLenRange[1]
      );
    }

    if (queries.outputDataLenRange && queries.data && queries.data !== "any") {
      const dataLen = getHexStringBytes(queries.data);
      if (
        dataLen < Number(queries.outputDataLenRange[0]) ||
        dataLen >= Number(queries.outputDataLenRange[1])
      ) {
        throw new Error("data length not match outputDataLenRange");
      }
    }

    if (queries.skip && typeof queries.skip !== "number") {
      throw new Error("skip must be a number!");
    }

    if (queries.bufferSize && typeof queries.bufferSize !== "number") {
      throw new Error("bufferSize must be a number!");
    }
  }

  public convertParams(): void {
    // unWrap `ScriptWrapper` into `Script`.
    if (this.queries.lock) {
      if (instanceOfScriptWrapper(this.queries.lock)) {
        validators.ValidateScript(this.queries.lock.script);
        this.queries.lock = this.queries.lock.script;
      }
    }

    // unWrap `ScriptWrapper` into `Script`.
    if (this.queries.type && this.queries.type !== "empty") {
      if (
        typeof this.queries.type === "object" &&
        instanceOfScriptWrapper(this.queries.type)
      ) {
        this.queries.type = this.queries.type.script;
      }
    }

    if (!this.queries.outputDataLenRange) {
      if (this.queries.data && this.queries.data !== "any") {
        const dataLenRange = getHexStringBytes(this.queries.data);
        this.queries.outputDataLenRange = [
          "0x" + dataLenRange.toString(16),
          "0x" + (dataLenRange + 1).toString(16),
        ];
      }
    }
  }

  private async getLiveCell(lastCursor?: string): Promise<GetCellsResults> {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      searchKeyFilter.lastCursor = lastCursor;
    }
    const result: GetCellsResults = await this.indexer.getCells(
      generateSearchKey(this.queries),
      undefined,
      searchKeyFilter
    );
    return result;
  }

  private shouldSkipped(cell: Cell, skippedCount = 0) {
    if (this.queries.skip && skippedCount < this.queries.skip) {
      return true;
    }
    if (cell && this.queries.type === "empty" && cell.cell_output.type) {
      return true;
    }
    if (this.queries.data !== "any" && cell.data !== this.queries.data) {
      return true;
    }
    if (
      this.queries.argsLen !== -1 &&
      this.queries.argsLen !== "any" &&
      getHexStringBytes(cell.cell_output.lock.args) !== this.queries.argsLen
    ) {
      return true;
    }
  }

  async count(): Promise<number> {
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
    let index = 0;
    let skippedCount = 0;
    /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
    while (true) {
      if (!this.shouldSkipped(cells[index], skippedCount)) {
        counter += 1;
      } else {
        skippedCount++;
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

  // eslint-disable-next-line
  private async request(rpcUrl: string, data: unknown): Promise<any> {
    const res: Response = await fetch(rpcUrl, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.status !== 200) {
      throw new Error(`indexer request failed with HTTP code ${res.status}`);
    }
    const result = await res.json();
    if (result.error !== undefined) {
      throw new Error(
        `indexer request rpc failed with error: ${JSON.stringify(result.error)}`
      );
    }
    return result;
  }

  private async getLiveCellWithBlockHash(lastCursor?: string) {
    if (!this.otherQueryOptions) {
      throw new Error("CKB Rpc URL must provide");
    }
    const result: GetCellsResults = await this.getLiveCell(lastCursor);
    if (result.objects.length === 0) {
      return result;
    }
    const requestData = result.objects.map((cell, index) => {
      return {
        id: index,
        jsonrpc: "2.0",
        method: "get_block_hash",
        params: [cell.block_number],
      };
    });
    const blockHashList: GetBlockHashRPCResult[] = await this.request(
      this.otherQueryOptions.ckbRpcUrl,
      requestData
    );
    result.objects = result.objects.map((item, index) => {
      const rpcResponse = blockHashList.find(
        (responseItem: GetBlockHashRPCResult) => responseItem.id === index
      );
      const block_hash = rpcResponse && rpcResponse.result;
      return { ...item, block_hash };
    });
    return result;
  }

  /** collect cells without block_hash by default.if you need block_hash, please add OtherQueryOptions.withBlockHash and OtherQueryOptions.ckbRpcUrl when constructor CellCollect.
   * don't use OtherQueryOption if you don't need block_hash,cause it will slowly your collect.
   */
  async *collect(): AsyncGenerator<Cell, void, unknown> {
    //TODO: fix return type
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
    let index = 0;
    let skippedCount = 0;
    while (true) {
      if (!this.shouldSkipped(cells[index], skippedCount)) {
        yield cells[index];
      } else {
        skippedCount++;
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
