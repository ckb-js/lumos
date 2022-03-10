"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createScriptRegistry = createScriptRegistry;

function createScriptRegistry(payload) {
  const map = new Map();
  Object.keys(payload).forEach(k => map.set(k, payload[k]));

  const extend = newPayload => {
    return createScriptRegistry({ ...payload,
      ...newPayload
    });
  };

  const newScript = (key, args) => {
    const config = map.get(key);
    if (config === undefined) throw new Error(`${key} doesn't exist in ScriptRegistry`);

    if (typeof args === "string") {
      return {
        code_hash: config.CODE_HASH,
        hash_type: config.HASH_TYPE,
        args: args
      };
    } else {
      return {
        code_hash: config.CODE_HASH,
        hash_type: config.HASH_TYPE,
        args: args.serializeJson()
      };
    }
  };

  const isScriptOf = (key, script) => {
    const config = map.get(key);
    if (config === undefined) throw new Error(`${key} doesn't exist in ScriptRegistry`);
    return script.code_hash === config.CODE_HASH && script.hash_type === config.HASH_TYPE;
  };

  const newCellDep = key => {
    const config = map.get(key);
    if (config === undefined) throw new Error(`${key} doesn't exist in ScriptRegistry`);
    return {
      out_point: {
        tx_hash: config.TX_HASH,
        index: config.INDEX
      },
      dep_type: config.DEP_TYPE
    };
  };

  const nameOfScript = script => {
    let name = undefined;
    map.forEach((value, key) => {
      if (script.code_hash === (value === null || value === void 0 ? void 0 : value.CODE_HASH) && script.hash_type === value.HASH_TYPE) {
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
    nameOfScript: nameOfScript
  };
}
//# sourceMappingURL=index.js.map