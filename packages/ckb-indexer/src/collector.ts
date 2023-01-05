import { utils, Cell, BaseCellCollector } from "@ckb-lumos/base";
import { validators } from "@ckb-lumos/toolkit";
import {
  SearchKeyFilter,
  CKBIndexerQueryOptions,
  GetCellsResults,
  Order,
  OtherQueryOptions,
  TerminableCellFetcher,
} from "./type";
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

/** CellCollector will not get cell with blockHash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get blockHash if you need. */
export class CKBCellCollector implements BaseCellCollector {
  public queries: CKBIndexerQueryOptions[];
  constructor(
    public terminableCellFetcher: TerminableCellFetcher,
    queries: CKBIndexerQueryOptions | CKBIndexerQueryOptions[],
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
    this.queries = (Array.isArray(queries) ? queries : [queries]).map(
      (query) => ({ ...defaultQuery, ...query })
    );
    this.validateQueryOption(this.queries);
    this.convertQueryOptionToSearchKey();
  }

  public validateQueryOption(queries: CKBIndexerQueryOptions[]): void {
    queries.forEach((query) => {
      if (!query.lock && (!query.type || query.type === "empty")) {
        throw new Error("Either lock or type script must be provided!");
      }

      if (query.lock) {
        if (!instanceOfScriptWrapper(query.lock)) {
          validators.ValidateScript(query.lock);
        } else if (instanceOfScriptWrapper(query.lock)) {
          validators.ValidateScript(query.lock.script);
        }
      }

      if (query.type && query.type !== "empty") {
        if (
          typeof query.type === "object" &&
          !instanceOfScriptWrapper(query.type)
        ) {
          validators.ValidateScript(query.type);
        } else if (
          typeof query.type === "object" &&
          instanceOfScriptWrapper(query.type)
        ) {
          validators.ValidateScript(query.type.script);
        }
      }

      if (query.fromBlock) {
        utils.assertHexadecimal("fromBlock", query.fromBlock);
      }
      if (query.toBlock) {
        utils.assertHexadecimal("toBlock", query.toBlock);
      }
      if (query.order !== "asc" && query.order !== "desc") {
        throw new Error("Order must be either asc or desc!");
      }
      if (query.outputCapacityRange) {
        utils.assertHexadecimal(
          "outputCapacityRange[0]",
          query.outputCapacityRange[0]
        );
        utils.assertHexadecimal(
          "outputCapacityRange[1]",
          query.outputCapacityRange[1]
        );
      }

      if (query.outputDataLenRange) {
        utils.assertHexadecimal(
          "outputDataLenRange[0]",
          query.outputDataLenRange[0]
        );
        utils.assertHexadecimal(
          "outputDataLenRange[1]",
          query.outputDataLenRange[1]
        );
      }
      if (query.scriptLenRange) {
        utils.assertHexadecimal("scriptLenRange[0]", query.scriptLenRange[0]);
        utils.assertHexadecimal("scriptLenRange[1]", query.scriptLenRange[1]);
      }

      if (query.outputDataLenRange && query.data && query.data !== "any") {
        const dataLen = getHexStringBytes(query.data);
        if (
          dataLen < Number(query.outputDataLenRange[0]) ||
          dataLen >= Number(query.outputDataLenRange[1])
        ) {
          throw new Error("data length not match outputDataLenRange");
        }
      }

      if (query.skip && typeof query.skip !== "number") {
        throw new Error("skip must be a number!");
      }

      if (query.bufferSize && typeof query.bufferSize !== "number") {
        throw new Error("bufferSize must be a number!");
      }
    });
  }

  public convertQueryOptionToSearchKey(): void {
    this.queries.forEach((query) => {
      const queryLock = query.lock;
      // unWrap `ScriptWrapper` into `Script`.
      if (queryLock) {
        if (instanceOfScriptWrapper(queryLock)) {
          validators.ValidateScript(queryLock.script);
          query.lock = queryLock.script;
        }
      }

      // unWrap `ScriptWrapper` into `Script`.
      if (query.type && query.type !== "empty") {
        if (
          typeof query.type === "object" &&
          instanceOfScriptWrapper(query.type)
        ) {
          validators.ValidateScript(query.type.script);
          query.type = query.type.script;
        }
      }

      if (!query.outputDataLenRange) {
        if (query.data && query.data !== "any") {
          const dataLenRange = getHexStringBytes(query.data);
          query.outputDataLenRange = [
            "0x" + dataLenRange.toString(16),
            "0x" + (dataLenRange + 1).toString(16),
          ];
        }
      }

      if (!query.scriptLenRange && query.type === "empty") {
        query.scriptLenRange = ["0x0", "0x1"];
      }
    });
  }

  private async getLiveCell(
    query: CKBIndexerQueryOptions,
    lastCursor?: string
  ): Promise<GetCellsResults> {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: query.bufferSize,
      order: query.order as Order,
      lastCursor,
    };
    const result = await this.terminableCellFetcher.getCells(
      generateSearchKey(query),
      undefined,
      searchKeyFilter
    );
    return result;
  }

  private shouldSkipped(
    cell: Cell,
    query: CKBIndexerQueryOptions,
    skippedCount = 0
  ) {
    if (query.skip && skippedCount < query.skip) {
      return true;
    }
    if (cell && query.type === "empty" && cell.cellOutput.type) {
      return true;
    }
    if (query.data !== "any" && cell.data !== query.data) {
      return true;
    }
    if (
      query.argsLen !== -1 &&
      query.argsLen !== "any" &&
      getHexStringBytes(cell.cellOutput.lock.args) !== query.argsLen
    ) {
      return true;
    }
  }

  async count(): Promise<number> {
    let counter = 0;
    const visitedCell = new Set<string>();

    for (const query of this.queries) {
      let lastCursor: undefined | string = undefined;
      const getCellWithCursor = async (
        query: CKBIndexerQueryOptions
      ): Promise<Cell[]> => {
        const result: GetCellsResults = await this.getLiveCell(
          query,
          lastCursor
        );
        lastCursor = result.lastCursor;
        return result.objects;
      };

      let cells: Cell[] = await getCellWithCursor(query);
      let buffer: Promise<Cell[]> = getCellWithCursor(query);
      let index = 0;
      let skippedCount = 0;
      while (true) {
        const cell = cells[index];
        const key = `${cell.outPoint?.txHash}-${cell.outPoint?.index}`;
        if (visitedCell.has(key)) {
          index++;
          continue;
        } else {
          visitedCell.add(key);
        }

        if (!this.shouldSkipped(cell, query, skippedCount)) {
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
          buffer = getCellWithCursor(query);
        }
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

  private async getLiveCellWithBlockHash(
    query: CKBIndexerQueryOptions,
    lastCursor?: string
  ) {
    if (!this.otherQueryOptions) {
      throw new Error("CKB Rpc URL must provide");
    }
    const result: GetCellsResults = await this.getLiveCell(query, lastCursor);
    if (result.objects.length === 0) {
      return result;
    }
    const requestData = result.objects.map((cell, index) => {
      return {
        id: index,
        jsonrpc: "2.0",
        method: "get_block_hash",
        params: [cell.blockNumber],
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
      const blockHash = rpcResponse && rpcResponse.result;
      return { ...item, blockHash };
    });
    return result;
  }

  /**
   * collect cells without blockHash by default.if you need blockHash, please add OtherQueryOptions.withBlockHash and OtherQueryOptions.ckbRpcUrl when constructor CellCollect.
   * don't use OtherQueryOption if you don't need blockHash,cause it will slowly your collect.
   */
  async *collect(): AsyncGenerator<Cell> {
    const withBlockHash =
      this.otherQueryOptions &&
      "withBlockHash" in this.otherQueryOptions &&
      this.otherQueryOptions.withBlockHash;

    const visitedCell = new Set<string>();

    for (const queryIndex of this.queries.keys()) {
      let lastCursor: undefined | string = undefined;
      const getCellWithCursor = async (
        query: CKBIndexerQueryOptions
      ): Promise<Cell[]> => {
        const result: GetCellsResults = await (withBlockHash
          ? this.getLiveCellWithBlockHash(query, lastCursor)
          : this.getLiveCell(query, lastCursor));
        lastCursor = result.lastCursor;
        return result.objects;
      };
      const query = this.queries[queryIndex];
      let cells = await getCellWithCursor(query);

      if (cells.length === 0) {
        // exhausted all of queries
        if (queryIndex === this.queries.length - 1) {
          return;
        }

        continue;
      }
      let buffer: Promise<Cell[]> = getCellWithCursor(query);
      let index = 0;
      let skippedCount = 0;
      while (true) {
        const cell = cells[index];
        const key = `${cell.outPoint?.txHash}-${cell.outPoint?.index}`;
        if (visitedCell.has(key)) {
          index++;
          continue;
        } else {
          visitedCell.add(key);
        }

        if (!this.shouldSkipped(cell, query, skippedCount)) {
          yield cell;
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
          buffer = getCellWithCursor(query);
        }
      }
    }
  }
}
