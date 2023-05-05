import {
  Cell,
  DataWithSearchMode,
  HexadecimalRange,
  Script,
  ScriptWrapper,
  blockchain,
} from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, SearchKey } from "./type";
import { bytes } from "@ckb-lumos/codec";
import { BI } from "@ckb-lumos/bi";

function convertQueryOptionToSearchKey(
  queryOptions: CKBIndexerQueryOptions
): SearchKey {
  let searchKeyLock: Script | undefined;
  let searchKeyType: Script | undefined;
  let searchKey: Required<SearchKey>;

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
        ? queryLock.searchMode || "prefix"
        : "prefix",
      filter: {},
    };
    searchKeyType && (searchKey.filter.script = searchKeyType);
  } else if (searchKeyType) {
    searchKey = {
      script: searchKeyType,
      scriptType: "type",
      scriptSearchMode: instanceOfScriptWrapper(queryType)
        ? queryType.searchMode || "prefix"
        : "prefix",
      filter: {},
    };
  } else {
    throw new Error("query.lock and query.type can't be both empty");
  }

  const {
    fromBlock,
    toBlock,
    outputDataLenRange,
    outputCapacityRange,
    scriptLenRange,
  } = queryOptions;

  if (fromBlock || toBlock) {
    searchKey.filter.blockRange = [
      fromBlock || "0x0",
      toBlock
        ? BI.from(toBlock).add(1).toHexString()
        : "0x" + Number.MAX_SAFE_INTEGER.toString(16),
    ];
  }

  if (outputDataLenRange) {
    searchKey.filter.outputDataLenRange = [
      outputDataLenRange[0],
      BI.from(outputDataLenRange[1]).add(1).toHexString(),
    ];
  }

  if (outputCapacityRange) {
    searchKey.filter.outputCapacityRange = [
      outputCapacityRange[0],
      BI.from(outputCapacityRange[1]).add(1).toHexString(),
    ];
  }

  if (scriptLenRange) {
    searchKey.filter.scriptLenRange = [
      scriptLenRange[0],
      BI.from(scriptLenRange[1]).add(1).toHexString(),
    ];
  }

  if (queryType === "empty") {
    searchKey.filter.scriptLenRange = ["0x0", "0x1"];
  }

  return searchKey;
}

function filterByQueryOptions(
  cells: Cell[],
  options: CKBIndexerQueryOptions
): Cell[] {
  const searchKey = convertQueryOptionToSearchKey(options);
  let filteredCells = cells.filter((cell) =>
    filterBySearchKey(cell, searchKey)
  );

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
export function filterBySearchKey(cell: Cell, searchKey: SearchKey): boolean {
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

  const { blockRange, outputCapacityRange, outputDataLenRange } = filter;

  if (blockRange) {
    const blockNumber = BI.from(cell.blockNumber || Number.MAX_SAFE_INTEGER);
    const fromBlock = BI.from(blockRange[0]);
    const toBlock = BI.from(blockRange[1]);
    if (blockNumber.lt(fromBlock) || blockNumber.gte(toBlock)) {
      return false;
    }
  }

  if (outputCapacityRange) {
    const capacity = BI.from(cellOutput.capacity);
    const fromCapacity = BI.from(outputCapacityRange[0]);
    const toCapacity = BI.from(outputCapacityRange[1]);
    if (capacity.lt(fromCapacity) || capacity.gte(toCapacity)) {
      return false;
    }
  }

  if (outputDataLenRange) {
    const dataLen = BI.from(bytes.bytify(cell.data).length);
    const fromDataLen = BI.from(outputDataLenRange[0]);
    const toDataLen = BI.from(outputDataLenRange[1]);
    if (dataLen.lt(fromDataLen) || dataLen.gte(toDataLen)) {
      return false;
    }
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

  // codeHash should always be 32 bytes, so it only supports exact match mode
  if (!bytes.equal(filterScript.codeHash, script.codeHash)) {
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
  filterByQueryOptions,
  convertQueryOptionToSearchKey,
  instanceOfDataWithSearchMode,
  instanceOfScriptWrapper,
  unwrapScriptWrapper,
  unwrapDataWrapper,
};
