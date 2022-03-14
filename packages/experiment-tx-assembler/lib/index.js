"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCell = createCell;
exports.createCellWithMinimalCapacity = createCellWithMinimalCapacity;
exports.createScriptRegistry = createScriptRegistry;

var _bi = require("@ckb-lumos/bi");

var _helpers = require("@ckb-lumos/helpers");

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

function createCell(payload, options) {
  const data = payload.data || "0x";
  let cellOutput = {
    capacity: _bi.BI.from(payload.capacity).toHexString(),
    lock: payload.lock
  };

  if (payload.type) {
    cellOutput = Object.assign(cellOutput, {
      type: payload.type
    });
  }

  let cell = {
    cell_output: cellOutput,
    data: data
  };

  if (payload.out_point) {
    cell = Object.assign(cell, {
      out_point: payload.out_point
    });
  }

  if (payload.block_hash) {
    cell = Object.assign(cell, {
      block_hash: payload.block_hash
    });
  }

  if (payload.block_number) {
    cell = Object.assign(cell, {
      block_number: payload.block_number
    });
  }

  if ((options === null || options === void 0 ? void 0 : options.skipCheckCapacityIsEnough) !== false) {
    const min = (0, _helpers.minimalCellCapacity)(cell);

    if (_bi.BI.from(payload.capacity).lt(min)) {
      throw new Error("provided capacity is not enough");
    }
  }

  return cell;
}

function createCellWithMinimalCapacity(payload) {
  const data = payload.data || "0x";
  let cellOutput = {
    capacity: "0x0",
    lock: payload.lock
  };

  if (payload.type) {
    cellOutput = Object.assign(cellOutput, {
      type: payload.type
    });
  }

  const cell = {
    cell_output: cellOutput,
    data: data
  };
  const min = (0, _helpers.minimalCellCapacity)(cell);
  cell.cell_output.capacity = _bi.BI.from(min).toHexString();
  return cell;
}
//# sourceMappingURL=index.js.map