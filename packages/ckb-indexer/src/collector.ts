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
import { bytes } from "@ckb-lumos/codec";
import {
  instanceOfDataWithSearchMode,
  unWrapDataWrapper,
} from "./ckbIndexerFilter";

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

    this.queries.forEach((query) => {
      this.validateQueryOption(query);
    });
    this.convertQueryOptionToSearchKey();
  }

  public validateQueryOption(queries: CKBIndexerQueryOptions): void {
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
    if (queries.scriptLenRange) {
      utils.assertHexadecimal("scriptLenRange[0]", queries.scriptLenRange[0]);
      utils.assertHexadecimal("scriptLenRange[1]", queries.scriptLenRange[1]);
    }

    if (queries.outputDataLenRange && queries.data && queries.data !== "any") {
      const dataLen = getHexStringBytes(unWrapDataWrapper(queries.data));
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
          const dataLenRange = getHexStringBytes(unWrapDataWrapper(query.data));
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
    query: CKBIndexerQueryOptions,
    cell: Cell,
    skippedCount = 0
  ) {
    if (query.skip && skippedCount < query.skip) {
      return true;
    }
    if (cell && query.type === "empty" && cell.cellOutput.type) {
      return true;
    }
    if (
      query.argsLen !== undefined &&
      query.argsLen !== -1 &&
      query.argsLen !== "any" &&
      getHexStringBytes(cell.cellOutput.lock.args) !== query.argsLen
    ) {
      return true;
    }

    if (!!query.data && query.data !== "any") {
      if (
        instanceOfDataWithSearchMode(query.data) &&
        query.data.searchMode === "exact" &&
        !bytes.equal(bytes.bytify(cell.data), bytes.bytify(query.data.data))
      ) {
        return true;
      } else if (
        instanceOfDataWithSearchMode(query.data) &&
        query.data.searchMode === "exact" &&
        Buffer.from(bytes.bytify(cell.data)).indexOf(
          bytes.bytify(query.data.data)
        ) !== 0
      ) {
        return true;
      } else if (
        Buffer.from(bytes.bytify(cell.data)).indexOf(
          bytes.bytify(query.data as string)
        ) !== 0
      ) {
        return true;
      }
    }
    return false;
  }

  async count(): Promise<number> {
    let counter = 0;

    for await (const _cell of this.collect()) {
      counter++;
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
    const visitedCellKey = new Set<string>();

    for (const query of this.queries) {
      for await (const cell of this.collectBySingleQuery(query)) {
        const key = `${cell.outPoint?.txHash}-${cell.outPoint?.index}`;
        if (visitedCellKey.has(key)) {
          continue;
        } else {
          visitedCellKey.add(key);
          yield cell;
        }
      }
    }
  }

  private async *collectBySingleQuery(
    query: CKBIndexerQueryOptions
  ): AsyncGenerator<Cell> {
    //TODO: fix return type
    const withBlockHash =
      this.otherQueryOptions &&
      "withBlockHash" in this.otherQueryOptions &&
      this.otherQueryOptions.withBlockHash;
    let lastCursor: undefined | string = undefined;
    const getCellWithCursor = async (): Promise<Cell[]> => {
      const result: GetCellsResults = await (withBlockHash
        ? this.getLiveCellWithBlockHash(query, lastCursor)
        : this.getLiveCell(query, lastCursor));
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
      if (!this.shouldSkipped(query, cells[index], skippedCount)) {
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
