import { Cell, HexadecimalRange, Script, blockchain } from "@ckb-lumos/base";
import { SearchKey } from "./type";
import { bytes } from "@ckb-lumos/codec";
import { BI } from "@ckb-lumos/bi";
import { decodeCursor } from "./indexerCursor";

interface CkbIndexerFilterOptions {
  searchKey: SearchKey;
  order?: "desc" | "asc";
  limit?: number;
  afterCursor?: string;
}

function filterByIndexerFilterProtocol(payload: {
  cells: Cell[];
  params: CkbIndexerFilterOptions;
}): Cell[] {
  const { cells, params: options } = payload;

  let filteredCells = cells.filter((cell) => filterBy(cell, options.searchKey));

  if (options.order === "desc") {
    filteredCells.reverse();
  }

  if (options.afterCursor) {
    filteredCells = filteredCells.filter((cell) =>
      isCellAfterCursor({
        cell,
        cursor: options.afterCursor!,
      })
    );
  }

  if (options.limit) {
    filteredCells = filteredCells.slice(0, options.limit);
  }

  return filteredCells;
}

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

  // Filter is always in prefix mode
  if (filter) {
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
  if (
    Buffer.from(bytes.bytify(script.codeHash)).indexOf(
      bytes.bytify(filterScript.codeHash)
    ) !== 0
  ) {
    return false;
  }
  if (
    Buffer.from(bytes.bytify(script.args)).indexOf(
      bytes.bytify(filterScript.args)
    ) !== 0
  ) {
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
        bytes.bytify(script.codeHash).length +
          bytes.bytify(script.args).length +
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

export {
  isCellAfterCursor,
  filterBy,
  checkScriptWithPrefixMode,
  checkScriptLenRange,
  filterByIndexerFilterProtocol,
};
export type { CkbIndexerFilterOptions };
