import { Script, CellDep } from "@ckb-lumos/base";
import { ScriptConfig, ScriptConfigs } from "@ckb-lumos/config-manager";
import { Reader } from "@ckb-lumos/toolkit";

interface ScriptRegistry<T extends ScriptConfigs> {
  extend: <T1 extends ScriptConfigs>(newPayload: T1) => ScriptRegistry<T & T1>;
  newScript: (key: keyof T, args: string | Reader) => Script;
  isScriptOf: (key: keyof T, script: Script) => boolean;
  newCellDep: (key: keyof T) => CellDep;
  nameOfScript: (script: Script) => string | undefined;
}

export function createScriptRegistry<T extends ScriptConfigs>(
  payload: T
): ScriptRegistry<T> {
  const map: Map<keyof T, ScriptConfig | undefined> = new Map();
  Object.keys(payload).forEach((k) => map.set(k, payload[k]));

  const extend = <T1 extends ScriptConfigs>(newPayload: T1) => {
    return createScriptRegistry({ ...payload, ...newPayload });
  };

  const newScript = (key: keyof T, args: string | Reader) => {
    const config = map.get(key);
    if (config === undefined) throw new Error("config doesn't exist");
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
        args: args.serializeJson(),
      };
    }
  };

  const isScriptOf = (key: keyof T, script: Script) => {
    const config = map.get(key);
    if (config === undefined) throw new Error("config doesn't exist");
    return (
      script.code_hash === config.CODE_HASH &&
      script.hash_type === config.HASH_TYPE
    );
  };

  const newCellDep = (key: keyof T) => {
    const config = map.get(key);
    if (config === undefined) throw new Error("config doesn't exist");
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
