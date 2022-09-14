"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nonNull = nonNull;
exports.toMolTypeMap = void 0;

// TODO: assert not null/undefined
function nonNull(data) {
  if (!data) {
    throw new Error(`${data} does not exist.`);
  }
}

const toMolTypeMap = results => {
  const map = new Map();
  results.forEach(result => {
    map.set(result.name, result);
  });
  return map;
};

exports.toMolTypeMap = toMolTypeMap;
//# sourceMappingURL=utils.js.map