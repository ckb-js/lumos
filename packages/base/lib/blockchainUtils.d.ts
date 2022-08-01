import { PackParam } from "@ckb-lumos/codec";
import * as blockchain from "./blockchain";
import { Transaction, Block, Header, UncleBlock } from '../lib/api';
declare type TransactionCodecType = PackParam<typeof blockchain.Transaction>;
declare type BlockCodecType = PackParam<typeof blockchain.Block>;
declare type UncleBlockCodecType = PackParam<typeof blockchain.UncleBlock>;
declare type HeaderCodecType = PackParam<typeof blockchain.Header>;
/**
 * from Transantion defined in  @ckb-lumos/base/lib/api.d.ts
 * ```
 * export interface Transaction {
 *  cellDeps: CellDep[];
 *  hash?: Hash;
 *  headerDeps: Hash[];
 *  inputs: Input[];
 *  outputs: Output[];
 *  outputsData: HexString[];
 *  version: HexNumber;
 *  witnesses: HexString[];
 *}
 * to :
 * interface TransactionCodecType {
 *   raw: {
 *     version: Uint32LE;
 *     cellDeps: DeCellDepVec;
 *     headerDeps: Byte32Vec;
 *     inputs: CellInputVec;
 *     outputs: CellOutputVec;
 *     outputsData: BytesVec;
 *   };
 *   witnesses: BytesVec;
 * }
 * ```
 * @param data Transantion defined in @ckb-lumos/base/lib/api.d.ts
 * @returns TransactionCodecType
 */
export declare function transformTransactionCodecType(data: Transaction): TransactionCodecType;
export declare function transformHeaderCodecType(data: Header): HeaderCodecType;
export declare function transformUncleBlockCodecType(data: UncleBlock): UncleBlockCodecType;
export declare function transformBlockCodecType(data: Block): BlockCodecType;
export {};
//# sourceMappingURL=blockchainUtils.d.ts.map