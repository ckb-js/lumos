import {
  FixedBytesCodec,
  createBytesCodec,
  BytesLike,
  BytesCodec,
  bytes,
  number,
} from "@ckb-lumos/codec";
import {
  array,
  byteVecOf,
  option,
  struct,
  table,
  union,
  vector,
} from "@ckb-lumos/codec/molecule";
import { createFixedHexBytesCodec } from "@ckb-lumos/base/blockchain";
import { byte, CodecMap, MolType, MolTypeMap } from "./type";
import { nonNull, toMolTypeMap } from "./utils";

function createHexBytesCodec(): BytesCodec<string, BytesLike> {
  return createBytesCodec({
    pack: (hex) => bytes.bytify(hex),
    unpack: (buf) => bytes.hexify(buf),
  });
}

/**
 * Add corresponding type and its depencies to result, then return coressponding codec
 * @param key
 * @param molTypeMap
 * @param result
 * @returns codec
 */
export const toCodec = (
  key: string,
  molTypeMap: MolTypeMap,
  result: CodecMap,
  refs?: CodecMap
): BytesCodec => {
  if (result[key]) {
    return result[key];
  }
  if (refs && refs[key]) {
    return refs[key];
  }
  const molType: MolType = molTypeMap[key];
  nonNull(molType);
  let codec = null;
  switch (molType.type) {
    case "array": {
      if (molType.name.startsWith("Uint")) {
        switch (molType.name) {
          case "Uint8":
            codec = number.Uint8;
            break;
          case "Uint16":
            codec = number.Uint16;
            break;
          case "Uint32":
            codec = number.Uint32;
            break;
          case "Uint64":
            codec = number.Uint64;
            break;
          case "Uint128":
            codec = number.Uint128;
            break;
          case "Uint256":
            codec = number.Uint256;
            break;
          case "Uint512":
            codec = number.Uint512;
            break;
          default:
            throw new Error(
              `Number codecs should be among Uint8,Uint8,Uint8,Uint8,Uint8,Uint8,Uint8 but got ${molType.name}.`
            );
        }
      } else if (molType.item === byte) {
        codec = createFixedHexBytesCodec(molType.item_count);
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result, refs);
        codec = array(itemMolType as FixedBytesCodec, molType.item_count);
      }
      break;
    }
    case "vector": {
      if (molType.item === byte) {
        codec = byteVecOf(createHexBytesCodec());
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result, refs);
        codec = vector(itemMolType);
      }
      break;
    }
    case "option": {
      if (molType.item === byte) {
        codec = option(createFixedHexBytesCodec(1));
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result, refs);
        codec = option(itemMolType);
      }
      break;
    }
    case "union": {
      const unionCodecs: Record<string, BytesCodec> = {};
      molType.items.forEach((itemMolTypeName) => {
        if (itemMolTypeName === byte) {
          unionCodecs[itemMolTypeName] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(
            itemMolTypeName,
            molTypeMap,
            result,
            refs
          );
          unionCodecs[itemMolTypeName] = itemMolType;
        }
      });
      codec = union(unionCodecs, Object.keys(unionCodecs));
      break;
    }
    case "table": {
      const tableFields = molType.fields;
      const tableCodecs: Record<string, BytesCodec> = {};
      tableFields.forEach((field) => {
        if (field.type === byte) {
          tableCodecs[field.name] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result, refs);
          tableCodecs[field.name] = itemMolType;
        }
      });
      codec = table(
        tableCodecs,
        tableFields.map((field) => field.name)
      );
      break;
    }
    case "struct": {
      const structFields = molType.fields;
      const structCodecs: Record<string, FixedBytesCodec> = {};
      structFields.forEach((field) => {
        if (field.type === byte) {
          structCodecs[field.name] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result, refs);
          structCodecs[field.name] = itemMolType as FixedBytesCodec;
        }
      });
      codec = struct(
        structCodecs,
        structFields.map((field) => field.name)
      );
      break;
    }
    default:
      throw new Error(`Not supportted molecule type ${molType}.`);
  }
  nonNull(codec);
  if (!result[key]) {
    result[key] = codec;
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
export const createCodecMap = (
  molTypeInfo: MolTypeMap | MolType[],
  refs?: CodecMap
): CodecMap => {
  const molTypeMap = ((data) => {
    if (Array.isArray(data)) {
      return toMolTypeMap(data as MolType[]);
    }
    return data as MolTypeMap;
  })(molTypeInfo);
  const result: CodecMap = {};
  for (const key in molTypeMap) {
    result[key] = toCodec(key, molTypeMap, result, refs);
  }
  return result;
};
