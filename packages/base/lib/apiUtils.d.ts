import { UnpackResult } from "@ckb-lumos/codec/lib/base";
import * as blockchain from "@ckb-lumos/codec/lib/blockchain";
import { CellDep, Input, OutPoint, Output, Transaction } from './api';
declare type HeaderCodecType = UnpackResult<typeof blockchain.Header>
declare type CellOutputCodecType = UnpackResult<typeof blockchain.CellOutput>;
declare type TransactionCodecType = UnpackResult<typeof blockchain.Transaction>;
declare type RawTransactionCodecType = UnpackResult<typeof blockchain.RawTransaction>;
declare type CellDepCodecType = UnpackResult<typeof blockchain.CellDep>;
declare type OutPointCodecType = UnpackResult<typeof blockchain.OutPoint>;
declare type CellInputCodecType = UnpackResult<typeof blockchain.CellInput>;
export declare function transformCellInputCodecType(data: Input): CellInputCodecType;
export declare function transformOutPointCodecType(data: OutPoint): OutPointCodecType;
export declare function transformCellDepCodecType(data: CellDep): CellDepCodecType;
export declare function transformCellOutputCodecType(data: Output): CellOutputCodecType;
export declare function transformRawTransactionCodecType(data: Transaction): RawTransactionCodecType;
export declare function transformTransactionCodecType(data: Transaction): TransactionCodecType;
