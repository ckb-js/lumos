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
  if (lock && argsLen === -1) {
    if (
      !new ScriptValue(cell.cell_output.lock, {
        validate: false,
      }).equals(new ScriptValue(lock, { validate: false }))
    ) {
      return false;
    }
  }

  if (lock && argsLen === "any") {
    const cellLock = cell.cell_output.lock;
    if (
      cellLock.code_hash !== lock.code_hash ||
      cellLock.hash_type !== lock.hash_type ||
      !cellLock.args.startsWith(lock.args)
    ) {
      return false;
    }
  }

  if (lock && typeof argsLen === "number" && argsLen >= 0) {
    const length = argsLen * 2 + 2;
    const lockArgsLength = lock.args.length;
    const minLength = Math.min(length, lockArgsLength);

    const cellLock = cell.cell_output.lock;
    if (cellLock.args.length !== length) {
      return false;
    }
    if (
      !(
        cellLock.code_hash === lock.code_hash &&
        cellLock.hash_type === lock.hash_type &&
        cellLock.args.slice(0, minLength) === lock.args.slice(0, minLength)
      )
    ) {
      return false;
    }
  }

  if (type && type === "empty" && cell.cell_output.type) {
    return false;
  }
  if (type && typeof type === "object") {
    if (
      !cell.cell_output.type ||
      !new ScriptValue(cell.cell_output.type, {
        validate: false,
      }).equals(new ScriptValue(type, { validate: false }))
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
