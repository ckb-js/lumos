import { AnyCodec, BytesLike, PackParam, UnpackResult } from "@ckb-lumos/codec";
import { BytesCodec, FixedBytesCodec } from '@ckb-lumos/codec/lib/base';
import { HashType as _HashType, DepType as _DepType } from '../lib/api';
export declare function createFixedHexBytesCodec(byteLength: number): FixedBytesCodec<string, BytesLike>;
/**
 * placeholder codec, generally used as a placeholder
 * ```
 * // for example, when some BytesOpt is not used, it will be filled with this codec
 * // option BytesOpt (Bytes);
 * const UnusedBytesOpt = UnknownOpt
 * ```
 */
export declare const Bytes: BytesCodec<string, BytesLike>;
export declare const BytesOpt: import("@ckb-lumos/codec/lib/molecule/layout").OptionCodec<BytesCodec<string, BytesLike>>;
export declare const BytesVec: BytesCodec<string[], BytesLike[]>;
export declare const Byte32: FixedBytesCodec<string, BytesLike>;
export declare const Byte32Vec: BytesCodec<string[], BytesLike[]>;
export declare function WitnessArgsOf<LockCodec extends AnyCodec, InputTypeCodec extends AnyCodec, OutputTypeCodec extends AnyCodec>(payload: {
    lock: LockCodec;
    inputType: InputTypeCodec;
    outputType: OutputTypeCodec;
}): BytesCodec<{
    lock?: UnpackResult<LockCodec>;
    inputType?: UnpackResult<InputTypeCodec>;
    outputType?: UnpackResult<OutputTypeCodec>;
}, {
    lock?: PackParam<LockCodec>;
    inputType?: PackParam<InputTypeCodec>;
    outputType?: PackParam<OutputTypeCodec>;
}>;
/**
 *
 * @example
 * ```ts
 * // secp256k1 lock witness
 * WitnessArgs.pack({ lock: '0x' + '00'.repeat(65) })
 * ```
 */
export declare const WitnessArgs: BytesCodec<{
    lock?: string | undefined;
    inputType?: string | undefined;
    outputType?: string | undefined;
}, {
    lock?: string | ArrayBuffer | ArrayLike<number> | undefined;
    inputType?: string | ArrayBuffer | ArrayLike<number> | undefined;
    outputType?: string | ArrayBuffer | ArrayLike<number> | undefined;
}>;
/**
 * Implementation of blockchain.mol
 * https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
 */
export declare const HashType: FixedBytesCodec<_HashType, _HashType>;
export declare const DepType: FixedBytesCodec<_DepType, _DepType>;
export declare const Script: BytesCodec<Partial<Pick<{
    codeHash: string;
    hashType: _HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: _HashType;
    args: string;
}, "codeHash" | "hashType" | "args">, Partial<Pick<{
    codeHash: BytesLike;
    hashType: _HashType;
    args: BytesLike;
}, never>> & Pick<{
    codeHash: BytesLike;
    hashType: _HashType;
    args: BytesLike;
}, "codeHash" | "hashType" | "args">>;
export declare const ScriptOpt: import("@ckb-lumos/codec/lib/molecule/layout").OptionCodec<BytesCodec<Partial<Pick<{
    codeHash: string;
    hashType: _HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: _HashType;
    args: string;
}, "codeHash" | "hashType" | "args">, Partial<Pick<{
    codeHash: BytesLike;
    hashType: _HashType;
    args: BytesLike;
}, never>> & Pick<{
    codeHash: BytesLike;
    hashType: _HashType;
    args: BytesLike;
}, "codeHash" | "hashType" | "args">>>;
export declare const OutPoint: BytesCodec<Partial<Pick<{
    txHash: string;
    index: number;
}, never>> & Pick<{
    txHash: string;
    index: number;
}, "txHash" | "index">, Partial<Pick<{
    txHash: BytesLike;
    index: import("@ckb-lumos/bi").BIish;
}, never>> & Pick<{
    txHash: BytesLike;
    index: import("@ckb-lumos/bi").BIish;
}, "txHash" | "index">> & import("@ckb-lumos/codec/lib/base").Fixed;
export declare const CellInput: BytesCodec<Partial<Pick<{
    since: import("@ckb-lumos/bi").BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: import("@ckb-lumos/bi").BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">, Partial<Pick<{
    since: import("@ckb-lumos/bi").BIish;
    previousOutput: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: import("@ckb-lumos/bi").BIish;
    previousOutput: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
}, "since" | "previousOutput">> & import("@ckb-lumos/codec/lib/base").Fixed;
export declare const CellInputVec: BytesCodec<(Partial<Pick<{
    since: import("@ckb-lumos/bi").BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: import("@ckb-lumos/bi").BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">)[], (Partial<Pick<{
    since: import("@ckb-lumos/bi").BIish;
    previousOutput: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: import("@ckb-lumos/bi").BIish;
    previousOutput: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
}, "since" | "previousOutput">)[]>;
export declare const CellOutput: BytesCodec<Partial<Pick<{
    capacity: import("@ckb-lumos/bi").BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: import("@ckb-lumos/bi").BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "lock" | "capacity">, Partial<Pick<{
    capacity: import("@ckb-lumos/bi").BIish;
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: import("@ckb-lumos/bi").BIish;
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "lock" | "capacity">>;
export declare const CellOutputVec: BytesCodec<(Partial<Pick<{
    capacity: import("@ckb-lumos/bi").BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: import("@ckb-lumos/bi").BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "lock" | "capacity">)[], (Partial<Pick<{
    capacity: import("@ckb-lumos/bi").BIish;
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: import("@ckb-lumos/bi").BIish;
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "lock" | "capacity">)[]>;
export declare const CellDep: BytesCodec<Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: _DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: _DepType;
}, "outPoint" | "depType">, Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
    depType: _DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
    depType: _DepType;
}, "outPoint" | "depType">> & import("@ckb-lumos/codec/lib/base").Fixed;
export declare const CellDepVec: BytesCodec<(Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: _DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: _DepType;
}, "outPoint" | "depType">)[], (Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
    depType: _DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        txHash: BytesLike;
        index: import("@ckb-lumos/bi").BIish;
    }, "txHash" | "index">;
    depType: _DepType;
}, "outPoint" | "depType">)[]>;
export declare const RawTransaction: BytesCodec<Partial<Pick<{
    version: number;
    cellDeps: (Partial<Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: _DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: _DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: import("@ckb-lumos/bi").BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: import("@ckb-lumos/bi").BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: import("@ckb-lumos/bi").BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: import("@ckb-lumos/bi").BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "lock" | "capacity">)[];
    outputsData: string[];
}, never>> & Pick<{
    version: number;
    cellDeps: (Partial<Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: _DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: _DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: import("@ckb-lumos/bi").BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: import("@ckb-lumos/bi").BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: import("@ckb-lumos/bi").BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: import("@ckb-lumos/bi").BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: _HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "lock" | "capacity">)[];
    outputsData: string[];
}, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">, Partial<Pick<{
    version: import("@ckb-lumos/bi").BIish;
    cellDeps: (Partial<Pick<{
        outPoint: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
        depType: _DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
        depType: _DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: BytesLike[];
    inputs: (Partial<Pick<{
        since: import("@ckb-lumos/bi").BIish;
        previousOutput: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: import("@ckb-lumos/bi").BIish;
        previousOutput: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: import("@ckb-lumos/bi").BIish;
        lock: Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: import("@ckb-lumos/bi").BIish;
        lock: Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "lock" | "capacity">)[];
    outputsData: BytesLike[];
}, never>> & Pick<{
    version: import("@ckb-lumos/bi").BIish;
    cellDeps: (Partial<Pick<{
        outPoint: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
        depType: _DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
        depType: _DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: BytesLike[];
    inputs: (Partial<Pick<{
        since: import("@ckb-lumos/bi").BIish;
        previousOutput: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: import("@ckb-lumos/bi").BIish;
        previousOutput: Partial<Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            txHash: BytesLike;
            index: import("@ckb-lumos/bi").BIish;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: import("@ckb-lumos/bi").BIish;
        lock: Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: import("@ckb-lumos/bi").BIish;
        lock: Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, never>> & Pick<{
            codeHash: BytesLike;
            hashType: _HashType;
            args: BytesLike;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "lock" | "capacity">)[];
    outputsData: BytesLike[];
}, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">>;
export declare const Transaction: BytesCodec<Partial<Pick<{
    raw: Partial<Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, never>> & Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, never>> & Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, "raw" | "witnesses">, Partial<Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: BytesLike[];
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: BytesLike[];
}, "raw" | "witnesses">>;
export declare const TransactionVec: BytesCodec<(Partial<Pick<{
    raw: Partial<Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, never>> & Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, never>> & Pick<{
        version: number;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: _HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, "raw" | "witnesses">)[], (Partial<Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: BytesLike[];
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        cellDeps: (Partial<Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
            depType: _DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: BytesLike[];
        inputs: (Partial<Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: import("@ckb-lumos/bi").BIish;
            previousOutput: Partial<Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, never>> & Pick<{
                txHash: BytesLike;
                index: import("@ckb-lumos/bi").BIish;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: import("@ckb-lumos/bi").BIish;
            lock: Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, never>> & Pick<{
                codeHash: BytesLike;
                hashType: _HashType;
                args: BytesLike;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "lock" | "capacity">)[];
        outputsData: BytesLike[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: BytesLike[];
}, "raw" | "witnesses">)[]>;
export declare const RawHeader: BytesCodec<Partial<Pick<{
    version: number;
    compactTarget: number;
    timestamp: import("@ckb-lumos/bi").BI;
    number: import("@ckb-lumos/bi").BI;
    epoch: import("@ckb-lumos/bi").BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extraHash: string;
    dao: string;
}, never>> & Pick<{
    version: number;
    compactTarget: number;
    timestamp: import("@ckb-lumos/bi").BI;
    number: import("@ckb-lumos/bi").BI;
    epoch: import("@ckb-lumos/bi").BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extraHash: string;
    dao: string;
}, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">, Partial<Pick<{
    version: import("@ckb-lumos/bi").BIish;
    compactTarget: import("@ckb-lumos/bi").BIish;
    timestamp: import("@ckb-lumos/bi").BIish;
    number: import("@ckb-lumos/bi").BIish;
    epoch: import("@ckb-lumos/bi").BIish;
    parentHash: BytesLike;
    transactionsRoot: BytesLike;
    proposalsHash: BytesLike;
    extraHash: BytesLike;
    dao: BytesLike;
}, never>> & Pick<{
    version: import("@ckb-lumos/bi").BIish;
    compactTarget: import("@ckb-lumos/bi").BIish;
    timestamp: import("@ckb-lumos/bi").BIish;
    number: import("@ckb-lumos/bi").BIish;
    epoch: import("@ckb-lumos/bi").BIish;
    parentHash: BytesLike;
    transactionsRoot: BytesLike;
    proposalsHash: BytesLike;
    extraHash: BytesLike;
    dao: BytesLike;
}, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">> & import("@ckb-lumos/codec/lib/base").Fixed;
export declare const Header: BytesCodec<Partial<Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: import("@ckb-lumos/bi").BI;
        number: import("@ckb-lumos/bi").BI;
        epoch: import("@ckb-lumos/bi").BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extraHash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: import("@ckb-lumos/bi").BI;
        number: import("@ckb-lumos/bi").BI;
        epoch: import("@ckb-lumos/bi").BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extraHash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
    nonce: import("@ckb-lumos/bi").BI;
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: import("@ckb-lumos/bi").BI;
        number: import("@ckb-lumos/bi").BI;
        epoch: import("@ckb-lumos/bi").BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extraHash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: import("@ckb-lumos/bi").BI;
        number: import("@ckb-lumos/bi").BI;
        epoch: import("@ckb-lumos/bi").BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extraHash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
    nonce: import("@ckb-lumos/bi").BI;
}, "raw" | "nonce">, Partial<Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        compactTarget: import("@ckb-lumos/bi").BIish;
        timestamp: import("@ckb-lumos/bi").BIish;
        number: import("@ckb-lumos/bi").BIish;
        epoch: import("@ckb-lumos/bi").BIish;
        parentHash: BytesLike;
        transactionsRoot: BytesLike;
        proposalsHash: BytesLike;
        extraHash: BytesLike;
        dao: BytesLike;
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        compactTarget: import("@ckb-lumos/bi").BIish;
        timestamp: import("@ckb-lumos/bi").BIish;
        number: import("@ckb-lumos/bi").BIish;
        epoch: import("@ckb-lumos/bi").BIish;
        parentHash: BytesLike;
        transactionsRoot: BytesLike;
        proposalsHash: BytesLike;
        extraHash: BytesLike;
        dao: BytesLike;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
    nonce: import("@ckb-lumos/bi").BIish;
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: import("@ckb-lumos/bi").BIish;
        compactTarget: import("@ckb-lumos/bi").BIish;
        timestamp: import("@ckb-lumos/bi").BIish;
        number: import("@ckb-lumos/bi").BIish;
        epoch: import("@ckb-lumos/bi").BIish;
        parentHash: BytesLike;
        transactionsRoot: BytesLike;
        proposalsHash: BytesLike;
        extraHash: BytesLike;
        dao: BytesLike;
    }, never>> & Pick<{
        version: import("@ckb-lumos/bi").BIish;
        compactTarget: import("@ckb-lumos/bi").BIish;
        timestamp: import("@ckb-lumos/bi").BIish;
        number: import("@ckb-lumos/bi").BIish;
        epoch: import("@ckb-lumos/bi").BIish;
        parentHash: BytesLike;
        transactionsRoot: BytesLike;
        proposalsHash: BytesLike;
        extraHash: BytesLike;
        dao: BytesLike;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
    nonce: import("@ckb-lumos/bi").BIish;
}, "raw" | "nonce">> & import("@ckb-lumos/codec/lib/base").Fixed;
export declare const ProposalShortId: FixedBytesCodec<string, BytesLike>;
export declare const ProposalShortIdVec: BytesCodec<string[], BytesLike[]>;
export declare const UncleBlock: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    proposals: BytesLike[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    proposals: BytesLike[];
}, "header" | "proposals">>;
export declare const UncleBlockVec: BytesCodec<(Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">)[], (Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    proposals: BytesLike[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    proposals: BytesLike[];
}, "header" | "proposals">)[]>;
export declare const Block: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
}, "header" | "proposals" | "uncles" | "transactions">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, "raw" | "witnesses">)[];
    proposals: BytesLike[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, "raw" | "witnesses">)[];
    proposals: BytesLike[];
}, "header" | "proposals" | "uncles" | "transactions">>;
export declare const BlockV1: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
    extension: string;
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: import("@ckb-lumos/bi").BI;
            number: import("@ckb-lumos/bi").BI;
            epoch: import("@ckb-lumos/bi").BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extraHash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: import("@ckb-lumos/bi").BI;
                number: import("@ckb-lumos/bi").BI;
                epoch: import("@ckb-lumos/bi").BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extraHash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, never>> & Pick<{
            version: number;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: _HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
    extension: string;
}, "header" | "proposals" | "uncles" | "transactions" | "extension">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, "raw" | "witnesses">)[];
    proposals: BytesLike[];
    extension: BytesLike;
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            compactTarget: import("@ckb-lumos/bi").BIish;
            timestamp: import("@ckb-lumos/bi").BIish;
            number: import("@ckb-lumos/bi").BIish;
            epoch: import("@ckb-lumos/bi").BIish;
            parentHash: BytesLike;
            transactionsRoot: BytesLike;
            proposalsHash: BytesLike;
            extraHash: BytesLike;
            dao: BytesLike;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
        nonce: import("@ckb-lumos/bi").BIish;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, never>> & Pick<{
                version: import("@ckb-lumos/bi").BIish;
                compactTarget: import("@ckb-lumos/bi").BIish;
                timestamp: import("@ckb-lumos/bi").BIish;
                number: import("@ckb-lumos/bi").BIish;
                epoch: import("@ckb-lumos/bi").BIish;
                parentHash: BytesLike;
                transactionsRoot: BytesLike;
                proposalsHash: BytesLike;
                extraHash: BytesLike;
                dao: BytesLike;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extraHash" | "dao">;
            nonce: import("@ckb-lumos/bi").BIish;
        }, "raw" | "nonce">;
        proposals: BytesLike[];
    }, "header" | "proposals">)[];
    transactions: (Partial<Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, never>> & Pick<{
            version: import("@ckb-lumos/bi").BIish;
            cellDeps: (Partial<Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
                depType: _DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: BytesLike[];
            inputs: (Partial<Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: import("@ckb-lumos/bi").BIish;
                previousOutput: Partial<Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, never>> & Pick<{
                    txHash: BytesLike;
                    index: import("@ckb-lumos/bi").BIish;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: import("@ckb-lumos/bi").BIish;
                lock: Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, never>> & Pick<{
                    codeHash: BytesLike;
                    hashType: _HashType;
                    args: BytesLike;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "lock" | "capacity">)[];
            outputsData: BytesLike[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: BytesLike[];
    }, "raw" | "witnesses">)[];
    proposals: BytesLike[];
    extension: BytesLike;
}, "header" | "proposals" | "uncles" | "transactions" | "extension">>;
export declare const CellbaseWitness: BytesCodec<Partial<Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, never>> & Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: _HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, "lock" | "message">, Partial<Pick<{
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    message: BytesLike;
}, never>> & Pick<{
    lock: Partial<Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, never>> & Pick<{
        codeHash: BytesLike;
        hashType: _HashType;
        args: BytesLike;
    }, "codeHash" | "hashType" | "args">;
    message: BytesLike;
}, "lock" | "message">>;
//# sourceMappingURL=blockchain.d.ts.map