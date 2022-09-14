import {
  FixedBytesCodec,
  createBytesCodec,
  BytesLike,
  BytesCodec,
} from "@ckb-lumos/codec/lib/base";
import {
  array,
  byteVecOf,
  option,
  struct,
  table,
  union,
  vector,
} from "@ckb-lumos/codec/lib/molecule";
import { createFixedHexBytesCodec } from "@ckb-lumos/codec/lib/blockchain";
import { byte, CodecMap, MolType, MolTypeMap } from "./type";
import { nonNull } from "./utils";
import { bytes, number } from "@ckb-lumos/codec";

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
  result: CodecMap
): BytesCodec => {
  if (result.has(key)) {
    return result.get(key)!;
  }
  const molType: MolType = molTypeMap.get(key)!;
  nonNull(molType);
  let codec = null;
  switch (molType.type) {
    case "array":
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
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = array(itemMolType as FixedBytesCodec, molType.item_count);
      }
      break;
    case "vector":
      if (molType.item === byte) {
        codec = byteVecOf(createHexBytesCodec());
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = vector(itemMolType);
      }
      break;
    case "option":
      if (molType.item === byte) {
        codec = option(createFixedHexBytesCodec(1));
      } else {
        const itemMolType = toCodec(molType.item, molTypeMap, result);
        codec = option(itemMolType);
      }
      break;
    case "union":
      const itemMolTypes = molType.items;
      const unionCodecs: Record<string, BytesCodec> = {};
      itemMolTypes.forEach((itemMolTypeName) => {
        if (itemMolTypeName === byte) {
          unionCodecs[itemMolTypeName] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(itemMolTypeName, molTypeMap, result);
          unionCodecs[itemMolTypeName] = itemMolType;
        }
      });
      codec = union(unionCodecs, Object.keys(unionCodecs));
      break;
    case "table":
      const tableFields = molType.fields;
      const tableCodecs: Record<string, BytesCodec> = {};
      tableFields.forEach((field) => {
        if (field.type === byte) {
          tableCodecs[field.name] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result);
          tableCodecs[field.name] = itemMolType;
        }
      });
      codec = table(
        tableCodecs,
        tableFields.map((field) => field.name)
      );
      break;
    case "struct":
      const structFields = molType.fields;
      const structCodecs: Record<string, FixedBytesCodec> = {};
      structFields.forEach((field) => {
        if (field.type === byte) {
          structCodecs[field.name] = createFixedHexBytesCodec(1);
        } else {
          const itemMolType = toCodec(field.type, molTypeMap, result);
          structCodecs[field.name] = itemMolType as FixedBytesCodec;
        }
      });
      codec = struct(
        structCodecs,
        structFields.map((field) => field.name)
      );
      break;
    default:
      throw new Error(`Not supportted molecule type ${molType}.`);
  }
  nonNull(codec);
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
export const createCodecMap = (molTypeMap: MolTypeMap): CodecMap => {
  const result = new Map<string, BytesCodec>();
  for (const entry of molTypeMap) {
    toCodec(entry[0], molTypeMap, result);
  }
  return result;
};
