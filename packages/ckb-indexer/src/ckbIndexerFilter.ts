import {
  Cell,
  DataWithSearchMode,
  HexadecimalRange,
  QueryOptions,
  Script,
  ScriptWrapper,
  blockchain,
} from "@ckb-lumos/base";
import { SearchKey } from "./type";
import { bytes } from "@ckb-lumos/codec";
import { BI } from "@ckb-lumos/bi";
import { decodeCursor } from "./indexerCursor";

function convertQueryOptionToSearchKey(queryOptions: QueryOptions): SearchKey {
  let searchKeyLock: Script | undefined;
  let searchKeyType: Script | undefined;
  let searchKey: SearchKey;

  const queryLock = queryOptions.lock;
  const queryType = queryOptions.type;
  if (queryLock) {
    if (instanceOfScriptWrapper(queryLock)) {
      searchKeyLock = queryLock.script;
    } else {
      searchKeyLock = queryLock;
    }
  }
  if (queryType && queryType !== "empty") {
    if (instanceOfScriptWrapper(queryType)) {
      searchKeyType = queryType.script;
    } else {
      searchKeyType = queryType;
    }
  }

  if (searchKeyLock) {
    searchKey = {
      script: searchKeyLock,
      scriptType: "lock",
      scriptSearchMode: instanceOfScriptWrapper(queryLock)
        ? queryLock.searchMode
        : "prefix",
      filter: {
        script: searchKeyType,
      },
    };
  } else if (searchKeyType) {
    searchKey = {
      script: searchKeyType,
      scriptType: "type",
      scriptSearchMode: instanceOfScriptWrapper(queryLock)
        ? queryLock.searchMode
        : "prefix",
      filter: {
        script: searchKeyLock,
      },
    };
  } else {
    throw new Error("query.lock and query.type can't be both empty");
  }

  if (queryOptions.fromBlock || queryOptions.toBlock) {
    searchKey.filter!.blockRange = [
      queryOptions.fromBlock || "0x0",
      queryOptions.toBlock
        ? BI.from(queryOptions.toBlock).add(1).toHexString()
        : "0x" + Number.MAX_SAFE_INTEGER.toString(16),
    ];
  }

  return searchKey;
}

function filterByQueryOptions(cells: Cell[], options: QueryOptions): Cell[] {
  const searchKey = convertQueryOptionToSearchKey(options);
  let filteredCells = cells.filter((cell) => filterBy(cell, searchKey));

  if (options.argsLen && options.argsLen !== "any") {
    filteredCells = filteredCells.filter(
      (cell) =>
        bytes.bytify(cell.cellOutput.lock.args).length === options.argsLen
    );
  }

  if (!!options.data && options.data !== "any") {
    if (
      instanceOfDataWithSearchMode(options.data) &&
      options.data.searchMode === "exact"
    ) {
      const dataSearch = options.data as DataWithSearchMode;
      filteredCells = filteredCells.filter((cell) =>
        bytes.equal(bytes.bytify(cell.data), bytes.bytify(dataSearch.data))
      );
    } else if (
      instanceOfDataWithSearchMode(options.data) &&
      options.data.searchMode === "prefix"
    ) {
      const dataSearch = options.data as DataWithSearchMode;
      filteredCells = filteredCells.filter((cell) => {
        const expectPrefix = bytes.bytify(dataSearch.data);
        const actualPrefix = bytes
          .bytify(cell.data)
          .slice(0, expectPrefix.length);
        return bytes.equal(expectPrefix, actualPrefix);
      });
    } else {
      filteredCells = filteredCells.filter((cell) => {
        const expectPrefix = bytes.bytify(options.data as string);
        const actualPrefix = bytes
          .bytify(cell.data)
          .slice(0, expectPrefix.length);
        return bytes.equal(expectPrefix, actualPrefix);
      });
    }
  }

  if (options.order === "desc") {
    filteredCells.reverse();
  }

  if (options.skip) {
    filteredCells = filteredCells.slice(options.skip);
  }

  return filteredCells;
}

/**
 * @internal
 */
function filterBy(cell: Cell, searchKey: SearchKey): boolean {
  const isExactMode = searchKey.scriptSearchMode === "exact";
  const { cellOutput } = cell;
  const { scriptType, script, filter } = searchKey;

  // Search mode
  if (isExactMode) {
    if (scriptType === "lock") {
      if (
        !bytes.equal(
          blockchain.Script.pack(cellOutput.lock),
          blockchain.Script.pack(script)
        )
      ) {
        return false;
      }
    } else {
      if (
        !cellOutput.type ||
        !bytes.equal(
          blockchain.Script.pack(cellOutput.type),
          blockchain.Script.pack(script)
        )
      ) {
        return false;
      }
    }
    // Prefix mode
  } else {
    if (scriptType === "lock") {
      if (!checkScriptWithPrefixMode(cellOutput.lock, script)) {
        return false;
      }
    } else {
      if (!checkScriptWithPrefixMode(cellOutput.type, script)) {
        return false;
      }
    }
  }

  // the "exact" mode works only on "SearchKey.script",
  // not on "SearchKey.filter.script"
  // the "SearchKey.filter.script" is always in prefix mode
  if (!filter) return true;
  // filter type script if scriptType is "lock"
  if (scriptType === "lock") {
    if (
      filter.script &&
      !checkScriptWithPrefixMode(cellOutput.type, filter.script)
    ) {
      return false;
    }

    if (
      filter.scriptLenRange &&
      !checkScriptLenRange(cellOutput.type, filter.scriptLenRange)
    ) {
      return false;
    }
    // filter lock script if scriptType is "type"
  } else {
    if (
      filter.script &&
      !checkScriptWithPrefixMode(cellOutput.lock, filter.script)
    ) {
      return false;
    }
    if (
      filter.scriptLenRange &&
      !checkScriptLenRange(cellOutput.lock, filter.scriptLenRange)
    ) {
      return false;
    }
  }

  if (filter.blockRange) {
    const blockNumber = BI.from(cell.blockNumber || Number.MAX_SAFE_INTEGER);
    const fromBlock = BI.from(filter.blockRange[0]);
    const toBlock = BI.from(filter.blockRange[1]);
    if (blockNumber.lt(fromBlock) || blockNumber.gte(toBlock)) {
      return false;
    }
  }
  if (filter.outputCapacityRange) {
    const capacity = BI.from(cellOutput.capacity);
    const fromCapacity = BI.from(filter.outputCapacityRange[0]);
    const toCapacity = BI.from(filter.outputCapacityRange[1]);
    if (capacity.lt(fromCapacity) || capacity.gte(toCapacity)) {
      return false;
    }
  }
  if (filter.outputDataLenRange) {
    const dataLen = BI.from(bytes.bytify(cell.data).length);
    const fromDataLen = BI.from(filter.outputDataLenRange[0]);
    const toDataLen = BI.from(filter.outputDataLenRange[1]);
    if (dataLen.lt(fromDataLen) || dataLen.gte(toDataLen)) {
      return false;
    }
  }

  return true;
}

function isCellAfterCursor(payload: { cell: Cell; cursor: string }): boolean {
  const { cell } = payload;
  const cursor = decodeCursor(payload.cursor);
  const cellBlockNumber = BI.from(cell.blockNumber || Number.MAX_SAFE_INTEGER);
  const cellTxIndex = BI.from(payload.cell.txIndex || Number.MAX_SAFE_INTEGER);
  const cellOutputIndex = BI.from(
    cell.outPoint?.index || Number.MAX_SAFE_INTEGER
  );

  const blockNumber = BI.from(cursor.blockNumber);
  const txIndex = BI.from(cursor.txIndex);
  const outputIndex = BI.from(cursor.outputIndex);

  // sequencially compare blockNumber, txIndex, outputIndex
  if (cellBlockNumber.lt(blockNumber)) {
    return false;
  }

  if (cellBlockNumber.eq(blockNumber) && cellTxIndex.lt(txIndex)) {
    return false;
  }

  if (
    cellBlockNumber.eq(blockNumber) &&
    cellTxIndex.eq(txIndex) &&
    cellOutputIndex.lte(outputIndex)
  ) {
    return false;
  }

  return true;
}

function checkScriptWithPrefixMode(
  script: Script | undefined,
  filterScript: Script
): boolean {
  if (!script) {
    return false;
  }

  const expectCodeHashPrefix = bytes.bytify(filterScript.codeHash);
  const actualCodeHashPrefix = bytes
    .bytify(script.codeHash)
    .slice(0, expectCodeHashPrefix.length);
  if (!bytes.equal(expectCodeHashPrefix, actualCodeHashPrefix)) {
    return false;
  }

  const expectArgsPrefix = bytes.bytify(filterScript.args);
  const actualArgsPrefix = bytes
    .bytify(script.args)
    .slice(0, expectArgsPrefix.length);
  if (!bytes.equal(expectArgsPrefix, actualArgsPrefix)) {
    return false;
  }

  if (script.hashType !== filterScript.hashType) {
    return false;
  }
  return true;
}

function checkScriptLenRange(
  script: Script | undefined,
  scriptLenRange: HexadecimalRange
): boolean {
  const scriptLen = script
    ? BI.from(
        bytes.concat(script.codeHash, script.args).length +
          1 /* hashType length is 1 */
      )
    : BI.from(0);
  const fromScriptLen = BI.from(scriptLenRange[0]);
  const toScriptLen = BI.from(scriptLenRange[1]);
  if (scriptLen.lt(fromScriptLen) || scriptLen.gte(toScriptLen)) {
    return false;
  }
  return true;
}

function instanceOfScriptWrapper(object: unknown): object is ScriptWrapper {
  return typeof object === "object" && object != null && "script" in object;
}

function instanceOfDataWithSearchMode(
  object: unknown
): object is DataWithSearchMode {
  return typeof object === "object" && object != null && "data" in object;
}

const unwrapScriptWrapper = (inputScript: ScriptWrapper | Script): Script => {
  if (instanceOfScriptWrapper(inputScript)) {
    return inputScript.script;
  }
  return inputScript;
};

const unwrapDataWrapper = (input: DataWithSearchMode | string): string => {
  if (instanceOfDataWithSearchMode(input)) {
    return input.data;
  }
  return input;
};

export {
  isCellAfterCursor,
  filterBy,
  filterByQueryOptions,
  convertQueryOptionToSearchKey,
  instanceOfDataWithSearchMode,
  instanceOfScriptWrapper,
  unwrapScriptWrapper,
  unwrapDataWrapper,
};
