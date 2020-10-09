const { ScriptValue } = require("./values");

function isCellMatchQueryOptions(
  cell,
  {
    lock = undefined,
    type = undefined,
    argsLen = -1,
    data = "any",
    fromBlock = undefined,
    toBlock = undefined,
  }
) {
  let wrappedLock = null;
  let wrappedType = null;
  // Wrap the plain `Script` into `ScriptWrapper`.
  if (lock && !lock.script) {
    wrappedLock = { script: lock, argsLen: argsLen };
  } else if (lock && lock.script) {
    wrappedLock = lock;
    // check argsLen
    if (!lock.argsLen) {
      wrappedLock.argsLen = argsLen;
    }
  }
  if (type && type === "empty") {
    wrappedType = type;
  } else if (type && typeof type === "object" && !type.script) {
    wrappedType = { script: type, argsLen: argsLen };
  } else if (type && typeof type === "object" && type.script) {
    wrappedType = type;
    // check argsLen
    if (!type.argsLen) {
      wrappedType.argsLen = argsLen;
    }
  }

  if (wrappedLock && wrappedLock.script && wrappedLock.argsLen === -1) {
    if (
      !new ScriptValue(cell.cell_output.lock, {
        validate: false,
      }).equals(new ScriptValue(wrappedLock.script, { validate: false }))
    ) {
      return false;
    }
  }

  if (wrappedLock && wrappedLock.script && wrappedLock.argsLen === "any") {
    const cellLock = cell.cell_output.lock;
    if (
      cellLock.code_hash !== wrappedLock.script.code_hash ||
      cellLock.hash_type !== wrappedLock.script.hash_type ||
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

    const cellLock = cell.cell_output.lock;
    if (cellLock.args.length !== length) {
      return false;
    }
    if (
      !(
        cellLock.code_hash === wrappedLock.script.code_hash &&
        cellLock.hash_type === wrappedLock.script.hash_type &&
        cellLock.args.slice(0, minLength) ===
          wrappedLock.script.args.slice(0, minLength)
      )
    ) {
      return false;
    }
  }

  if (wrappedType && wrappedType === "empty" && cell.cell_output.type) {
    return false;
  }
  if (wrappedType && typeof wrappedType === "object") {
    if (
      !cell.cell_output.type ||
      !new ScriptValue(cell.cell_output.type, {
        validate: false,
      }).equals(new ScriptValue(wrappedType.script, { validate: false }))
    ) {
      return false;
    }
  }
  if (data && data !== "any" && cell.data !== data) {
    return false;
  }
  if (
    fromBlock &&
    cell.block_number &&
    BigInt(cell.block_number) < BigInt(fromBlock)
  ) {
    return false;
  }
  if (
    toBlock &&
    cell.block_number &&
    BigInt(cell.block_number) > BigInt(toBlock)
  ) {
    return false;
  }

  return true;
}

module.exports = {
  isCellMatchQueryOptions,
};
