"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toCodec = exports.createCodecMap = void 0;

var _base = require("@ckb-lumos/codec/lib/base");

var _molecule = require("@ckb-lumos/codec/lib/molecule");

var _blockchain = require("@ckb-lumos/codec/lib/blockchain");

var _type = require("./type");

var _utils = require("./utils");

var _codec = require("@ckb-lumos/codec");

function createHexBytesCodec() {
  return (0, _base.createBytesCodec)({
    pack: hex => _codec.bytes.bytify(hex),
    unpack: buf => _codec.bytes.hexify(buf)
  });
}
/**
 * Add corresponding type and its depencies to result, then return coressponding codec
 * @param key 
 * @param molTypeMap 
 * @param result 
 * @returns codec
 */


const toCodec = (key, molTypeMap, result) => {
  if (result.has(key)) {
    return result.get(key);
  }

  const molType = molTypeMap.get(key);
  (0, _utils.nonNull)(molType);
  let codec = null;

  switch (molType.type) {
    case "array":
      if (molType.name.startsWith("Uint")) {
        switch (molType.name) {
          case "Uint8":
            codec = _codec.number.Uint8;
            break;

          case "Uint16":
            codec = _codec.number.Uint16;
            break;

          case "Uint32":
            codec = _codec.number.Uint32;
            break;

          case "Uint64":
            codec = _codec.number.Uint64;
            break;

          case "Uint128":
            codec = _codec.number.Uint128;
            break;

          case "Uint256":
            codec = _codec.number.Uint256;
            break;

          case "Uint512":
            codec = _codec.number.Uint512;
            break;

          default:
            throw new Error(`Number codecs should be among Uint8,Uint8,Uint8,Uint8,Uint8,Uint8,Uint8 but got ${molType.name}.`);
        }
      } else if (molType.item === _type.byte) {
        codec = (0, _blockchain.createFixedHexBytesCodec)(molType.item_count);
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = (0, _molecule.array)(itemMolType, molType.item_count);
      }

      break;

    case "vector":
      if (molType.item === _type.byte) {
        codec = (0, _molecule.byteVecOf)(createHexBytesCodec());
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = (0, _molecule.vector)(itemMolType);
      }

      break;

    case "option":
      if (molType.item === _type.byte) {
        codec = (0, _molecule.option)((0, _blockchain.createFixedHexBytesCodec)(1));
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = (0, _molecule.option)(itemMolType);
      }

      break;

    case "union":
      const itemMolTypes = molType.items;
      const unionCodecs = {};
      itemMolTypes.forEach(itemMolTypeName => {
        if (itemMolTypeName === _type.byte) {
          unionCodecs[itemMolTypeName] = (0, _blockchain.createFixedHexBytesCodec)(1);
        } else {
          const itemMolType = toCodec(itemMolTypeName, molTypeMap, result);
          unionCodecs[itemMolTypeName] = itemMolType;
        }
      });
      codec = (0, _molecule.union)(unionCodecs, Object.keys(unionCodecs));
      break;

    case "table":
      const tableFields = molType.fields;
      const tableCodecs = {};
      tableFields.forEach(field => {
        if (field.type === _type.byte) {
          tableCodecs[field.name] = (0, _blockchain.createFixedHexBytesCodec)(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result);
          tableCodecs[field.name] = itemMolType;
        }
      });
      codec = (0, _molecule.table)(tableCodecs, tableFields.map(field => field.name));
      break;

    case "struct":
      const structFields = molType.fields;
      const structCodecs = {};
      structFields.forEach(field => {
        if (field.type === _type.byte) {
          structCodecs[field.name] = (0, _blockchain.createFixedHexBytesCodec)(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result);
          structCodecs[field.name] = itemMolType;
        }
      });
      codec = (0, _molecule.struct)(structCodecs, structFields.map(field => field.name));
      break;

    default:
      throw new Error(`Not supportted molecule type ${molType}.`);
  }

  (0, _utils.nonNull)(codec);

  if (!result.has(key)) {
    result.set(key, codec);
  } else {
    console.error(`Existing codec: ${key} has been added to result.`);
  }

  return codec;
};
/**
 * create Codecs from tokens
 * @param molTypeMap 
 * @returns 
 */


exports.toCodec = toCodec;

const createCodecMap = molTypeMap => {
  const result = new Map();

  for (const entry of molTypeMap) {
    toCodec(entry[0], molTypeMap, result);
  }

  return result;
};

exports.createCodecMap = createCodecMap;
//# sourceMappingURL=codec.js.map