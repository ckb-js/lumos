import { BytesCodec } from '@ckb-lumos/codec/lib/base';
import { CodecMap, MolTypeMap } from "./type";
/**
 * Add corresponding type and its depencies to result, then return coressponding codec
 * @param key
 * @param molTypeMap
 * @param result
 * @returns codec
 */
export declare const toCodec: (key: string, molTypeMap: MolTypeMap, result: CodecMap) => BytesCodec<any, any>;
/**
 * create Codecs from tokens
 * @param molTypeMap
 * @returns
 */
export declare const createCodecMap: (molTypeMap: MolTypeMap) => CodecMap;
