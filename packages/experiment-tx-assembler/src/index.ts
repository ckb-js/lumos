import {
  Script,
  CellDep,
  HexString,
  OutPoint,
  Hash,
  HexNumber,
  Cell,
} from "@ckb-lumos/base";
import { BI, BIish } from "@ckb-lumos/bi";
import { minimalCellCapacity } from "@ckb-lumos/helpers";
import { ScriptConfig, ScriptConfigs } from "@ckb-lumos/config-manager";

interface ScriptRegistry<T extends ScriptConfigs> {
  extend: <T1 extends ScriptConfigs>(newPayload: T1) => ScriptRegistry<T & T1>;
  newScript: (key: keyof T, args: string) => Script;
  isScriptOf: (key: keyof T, script: Script) => boolean;
  newCellDep: (key: keyof T) => CellDep;
  nameOfScript: (script: Script) => keyof T | undefined;
}

export function createScriptRegistry<T extends ScriptConfigs>(
  payload: T
): ScriptRegistry<T> {
  const map: Map<keyof T, ScriptConfig | undefined> = new Map();
  Object.keys(payload).forEach((k) => map.set(k, payload[k]));

  const extend = <T1 extends ScriptConfigs>(newPayload: T1) => {
    return createScriptRegistry({ ...payload, ...newPayload });
  };

  const newScript = (key: keyof T, args: string) => {
    const config = map.get(key);
    if (config === undefined)
      throw new Error(`${String(key)} doesn't exist in ScriptRegistry`);
    if (typeof args === "string") {
      return {
        code_hash: config.CODE_HASH,
        hash_type: config.HASH_TYPE,
        args: args,
      };
    } else {
      return {
        code_hash: config.CODE_HASH,
        hash_type: config.HASH_TYPE,
        args: args,
      };
    }
  };

  const isScriptOf = (key: keyof T, script: Script) => {
    const config = map.get(key);
    if (config === undefined)
      throw new Error(`${String(key)} doesn't exist in ScriptRegistry`);
    return (
      script.code_hash === config.CODE_HASH &&
      script.hash_type === config.HASH_TYPE
    );
  };

  const newCellDep = (key: keyof T) => {
    const config = map.get(key);
    if (config === undefined)
      throw new Error(`${String(key)} doesn't exist in ScriptRegistry`);
    return {
      out_point: {
        tx_hash: config.TX_HASH,
        index: config.INDEX,
      },
      dep_type: config.DEP_TYPE,
    };
  };

  const nameOfScript = (script: Script) => {
    let name = undefined;
    map.forEach((value, key) => {
      if (
        script.code_hash === value?.CODE_HASH &&
        script.hash_type === value.HASH_TYPE
      ) {
        name = key;
      }
    });
    return name;
  };

  return {
    extend: extend,
    newScript: newScript,
    isScriptOf: isScriptOf,
    newCellDep: newCellDep,
    nameOfScript: nameOfScript,
  };
}

interface Payload {
  lock: Script;
  type?: Script;
  capacity: BIish;
  data?: HexString;
  out_point?: OutPoint;
  block_hash?: Hash;
  block_number?: HexNumber;
}

export function createCell(
  payload: Payload,
  options?: { skipCheckCapacityIsEnough?: boolean }
): Cell {
  const data = payload.data || "0x";
  let cellOutput = {
    capacity: BI.from(payload.capacity).toHexString(),
    lock: payload.lock,
  };
  if (payload.type) {
    cellOutput = Object.assign(cellOutput, { type: payload.type });
  }
  let cell = {
    cell_output: cellOutput,
    data: data,
  };
  if (payload.out_point) {
    cell = Object.assign(cell, { out_point: payload.out_point });
  }
  if (payload.block_hash) {
    cell = Object.assign(cell, { block_hash: payload.block_hash });
  }
  if (payload.block_number) {
    cell = Object.assign(cell, { block_number: payload.block_number });
  }
  if (options?.skipCheckCapacityIsEnough !== false) {
    const min = minimalCellCapacity(cell);
    if (BI.from(payload.capacity).lt(min)) {
      throw new Error("provided capacity is not enough");
    }
  }
  return cell;
}

export function createCellWithMinimalCapacity(payload: {
  lock: Script;
  type?: Script;
  data?: HexString;
}): Cell {
  const data = payload.data || "0x";
  let cellOutput = {
    capacity: "0x0",
    lock: payload.lock,
  };
  if (payload.type) {
    cellOutput = Object.assign(cellOutput, { type: payload.type });
  }
  const cell = {
    cell_output: cellOutput,
    data: data,
  };
  const min = minimalCellCapacity(cell);
  cell.cell_output.capacity = BI.from(min).toHexString();
  return cell;
}
