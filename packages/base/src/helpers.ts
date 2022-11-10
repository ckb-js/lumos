import { ScriptValue } from "./values";
import { BI } from "@ckb-lumos/bi";

import { Cell, Script } from "./api";
import { QueryOptions, ScriptWrapper } from "./indexer";

/**
 * return if the input is a script wrapper
 * @param maybeWrapped
 */
export function isScriptWrapper(
  maybeWrapped: Script | ScriptWrapper | null
): maybeWrapped is ScriptWrapper {
  return (
    maybeWrapped !== null &&
    (maybeWrapped as ScriptWrapper).script !== undefined
  );
}

export function isCellMatchQueryOptions(
  cell: Cell,
  {
    lock = undefined,
    type = undefined,
    argsLen = -1,
    data = "any",
    fromBlock = undefined,
    toBlock = undefined,
  }: QueryOptions
): boolean {
  let wrappedLock: ScriptWrapper | null = null;
  let wrappedType: "empty" | ScriptWrapper | Script | null = null;

  // Wrap the plain `Script` into `ScriptWrapper`.
  if (lock && !isScriptWrapper(lock)) {
    wrappedLock = { script: lock, argsLen: argsLen };
  } else if (lock) {
    wrappedLock = lock;
    // check argsLen
    if (!lock.argsLen) {
      wrappedLock.argsLen = argsLen;
    }
  }
  if (type && type === "empty") {
    wrappedType = type;
  } else if (type && typeof type === "object" && !isScriptWrapper(type)) {
    wrappedType = { script: type, argsLen: argsLen };
  } else if (type && typeof type === "object" && isScriptWrapper(type)) {
    wrappedType = type;
    // check argsLen
    if (!type.argsLen) {
      wrappedType.argsLen = argsLen;
    }
  }

  if (wrappedLock && wrappedLock.script && wrappedLock.argsLen === -1) {
    if (
      !new ScriptValue(cell.cellOutput.lock, {
        validate: false,
      }).equals(new ScriptValue(wrappedLock.script, { validate: false }))
    ) {
      return false;
    }
  }

  if (wrappedLock && wrappedLock.script && wrappedLock.argsLen === "any") {
    const cellLock = cell.cellOutput.lock;
    if (
      cellLock.codeHash !== wrappedLock.script.codeHash ||
      cellLock.hashType !== wrappedLock.script.hashType ||
      !cellLock.args.startsWith(wrappedLock.script.args)
    ) {
      return false;
    }
  }

  if (
    wrappedLock &&
    wrappedLock.script &&
    typeof wrappedLock.argsLen === "number" &&
    wrappedLock.argsLen >= 0
  ) {
    const length = wrappedLock.argsLen * 2 + 2;
    const lockArgsLength = wrappedLock.script.args.length;
    const minLength = Math.min(length, lockArgsLength);

    const cellLock = cell.cellOutput.lock;
    if (cellLock.args.length !== length) {
      return false;
    }
    if (
      !(
        cellLock.codeHash === wrappedLock.script.codeHash &&
        cellLock.hashType === wrappedLock.script.hashType &&
        cellLock.args.slice(0, minLength) ===
          wrappedLock.script.args.slice(0, minLength)
      )
    ) {
      return false;
    }
  }

  if (wrappedType && wrappedType === "empty" && cell.cellOutput.type) {
    return false;
  }
  if (wrappedType && typeof wrappedType === "object") {
    if (
      !cell.cellOutput.type ||
      !new ScriptValue(cell.cellOutput.type, {
        validate: false,
      }).equals(
        new ScriptValue(wrappedType.script, {
          validate: false,
        })
      )
    ) {
      return false;
    }
  }
  if (data && data !== "any" && cell.data !== data) {
    return false;
  }
  if (
    fromBlock &&
    cell.blockNumber &&
    BI.from(cell.blockNumber).lt(BI.from(fromBlock))
  ) {
    return false;
  }
  if (
    toBlock &&
    cell.blockNumber &&
    BI.from(cell.blockNumber).gt(BI.from(toBlock))
  ) {
    return false;
  }

  return true;
}
