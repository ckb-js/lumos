import { AnyCodec, BytesCodec, FixedBytesCodec, UnpackResult } from "./base";
import { BI } from "@ckb-lumos/bi";
export declare type _HashType = "type" | "data" | "data1";
export declare type _DepType = "depGroup" | "code";
export declare const createFixedHexBytesCodec: (byteLength: number) => FixedBytesCodec<string>;
/**
 * placeholder codec, generally used as a placeholder
 * ```
 * // for example, when some BytesOpt is not used, it will be filled with this codec
 * // option BytesOpt (Bytes);
 * const UnusedBytesOpt = UnknownOpt
 * ```
 */
export declare const Bytes: BytesCodec<string, string>;
export declare const BytesOpt: import("./molecule/layout").OptionCodec<BytesCodec<string, string>>;
export declare const BytesVec: BytesCodec<string[], string[]>;
export declare const Byte32: FixedBytesCodec<string, string>;
export declare const Byte32Vec: BytesCodec<string[], string[]>;
export declare function WitnessArgsOf<LockCodec extends AnyCodec, InputTypeCodec extends AnyCodec, OutputTypeCodec extends AnyCodec>(payload: {
    lock: LockCodec;
    inputType: InputTypeCodec;
    outputType: OutputTypeCodec;
}): BytesCodec<{
    lock?: UnpackResult<LockCodec>;
    inputType?: UnpackResult<InputTypeCodec>;
    outputType?: UnpackResult<OutputTypeCodec>;
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
    lock?: string | undefined;
    inputType?: string | undefined;
    outputType?: string | undefined;
}>;
/**
 * Implementation of blockchain.mol
 * https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
 */
export declare const HashType: import("./base").FixedBytesLikeCodec<import("@ckb-lumos/base").HashType, import("@ckb-lumos/base").HashType>;
export declare const DepType: import("./base").FixedBytesLikeCodec<import("@ckb-lumos/base").DepType, import("@ckb-lumos/base").DepType>;
export declare const Script: BytesCodec<Partial<Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, "codeHash" | "hashType" | "args">, Partial<Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, "codeHash" | "hashType" | "args">>;
export declare const ScriptOpt: import("./molecule/layout").OptionCodec<BytesCodec<Partial<Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, "codeHash" | "hashType" | "args">, Partial<Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, never>> & Pick<{
    codeHash: string;
    hashType: import("@ckb-lumos/base").HashType;
    args: string;
}, "codeHash" | "hashType" | "args">>>;
export declare const OutPoint: BytesCodec<Partial<Pick<{
    txHash: string;
    index: number;
}, never>> & Pick<{
    txHash: string;
    index: number;
}, "txHash" | "index">, Partial<Pick<{
    txHash: string;
    index: number;
}, never>> & Pick<{
    txHash: string;
    index: number;
}, "txHash" | "index">> & import("./base").BaseHeader;
export declare const CellInput: BytesCodec<Partial<Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">, Partial<Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">> & import("./base").BaseHeader;
export declare const CellInputVec: BytesCodec<(Partial<Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">)[], (Partial<Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, never>> & Pick<{
    since: BI;
    previousOutput: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
}, "since" | "previousOutput">)[]>;
export declare const CellOutput: BytesCodec<Partial<Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "capacity" | "lock">, Partial<Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "capacity" | "lock">>;
export declare const CellOutputVec: BytesCodec<(Partial<Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "capacity" | "lock">)[], (Partial<Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "type">> & Pick<{
    capacity: BI;
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    type: (Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">) | undefined;
}, "capacity" | "lock">)[]>;
export declare const CellDep: BytesCodec<Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, "outPoint" | "depType">, Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, "outPoint" | "depType">> & import("./base").BaseHeader;
export declare const DeCellDepVec: BytesCodec<(Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, "outPoint" | "depType">)[], (Partial<Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
}, never>> & Pick<{
    outPoint: Partial<Pick<{
        txHash: string;
        index: number;
    }, never>> & Pick<{
        txHash: string;
        index: number;
    }, "txHash" | "index">;
    depType: import("@ckb-lumos/base").DepType;
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
        depType: import("@ckb-lumos/base").DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: import("@ckb-lumos/base").DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "capacity" | "lock">)[];
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
        depType: import("@ckb-lumos/base").DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: import("@ckb-lumos/base").DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "capacity" | "lock">)[];
    outputsData: string[];
}, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">, Partial<Pick<{
    version: number;
    cellDeps: (Partial<Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: import("@ckb-lumos/base").DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: import("@ckb-lumos/base").DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "capacity" | "lock">)[];
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
        depType: import("@ckb-lumos/base").DepType;
    }, never>> & Pick<{
        outPoint: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
        depType: import("@ckb-lumos/base").DepType;
    }, "outPoint" | "depType">)[];
    headerDeps: string[];
    inputs: (Partial<Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, never>> & Pick<{
        since: BI;
        previousOutput: Partial<Pick<{
            txHash: string;
            index: number;
        }, never>> & Pick<{
            txHash: string;
            index: number;
        }, "txHash" | "index">;
    }, "since" | "previousOutput">)[];
    outputs: (Partial<Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "type">> & Pick<{
        capacity: BI;
        lock: Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">;
        type: (Partial<Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, never>> & Pick<{
            codeHash: string;
            hashType: import("@ckb-lumos/base").HashType;
            args: string;
        }, "codeHash" | "hashType" | "args">) | undefined;
    }, "capacity" | "lock">)[];
    outputsData: string[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, "raw" | "witnesses">, Partial<Pick<{
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, "raw" | "witnesses">)[], (Partial<Pick<{
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
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
            depType: import("@ckb-lumos/base").DepType;
        }, never>> & Pick<{
            outPoint: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
            depType: import("@ckb-lumos/base").DepType;
        }, "outPoint" | "depType">)[];
        headerDeps: string[];
        inputs: (Partial<Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, never>> & Pick<{
            since: BI;
            previousOutput: Partial<Pick<{
                txHash: string;
                index: number;
            }, never>> & Pick<{
                txHash: string;
                index: number;
            }, "txHash" | "index">;
        }, "since" | "previousOutput">)[];
        outputs: (Partial<Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "type">> & Pick<{
            capacity: BI;
            lock: Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">;
            type: (Partial<Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, never>> & Pick<{
                codeHash: string;
                hashType: import("@ckb-lumos/base").HashType;
                args: string;
            }, "codeHash" | "hashType" | "args">) | undefined;
        }, "capacity" | "lock">)[];
        outputsData: string[];
    }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
    witnesses: string[];
}, "raw" | "witnesses">)[]>;
export declare const RawHeader: BytesCodec<Partial<Pick<{
    version: number;
    compactTarget: number;
    timestamp: BI;
    number: BI;
    epoch: BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extra_hash: string;
    dao: string;
}, never>> & Pick<{
    version: number;
    compactTarget: number;
    timestamp: BI;
    number: BI;
    epoch: BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extra_hash: string;
    dao: string;
}, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">, Partial<Pick<{
    version: number;
    compactTarget: number;
    timestamp: BI;
    number: BI;
    epoch: BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extra_hash: string;
    dao: string;
}, never>> & Pick<{
    version: number;
    compactTarget: number;
    timestamp: BI;
    number: BI;
    epoch: BI;
    parentHash: string;
    transactionsRoot: string;
    proposalsHash: string;
    extra_hash: string;
    dao: string;
}, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">> & import("./base").BaseHeader;
export declare const BaseHeader: BytesCodec<Partial<Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
    nonce: BI;
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
    nonce: BI;
}, "raw" | "nonce">, Partial<Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
    nonce: BI;
}, never>> & Pick<{
    raw: Partial<Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, never>> & Pick<{
        version: number;
        compactTarget: number;
        timestamp: BI;
        number: BI;
        epoch: BI;
        parentHash: string;
        transactionsRoot: string;
        proposalsHash: string;
        extra_hash: string;
        dao: string;
    }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
    nonce: BI;
}, "raw" | "nonce">> & import("./base").BaseHeader;
export interface _HeaderType {
    version: number;
    compactTarget: number;
    timestamp: BI;
    number: BI;
    epoch: BI;
    dao: string;
    parentHash: string;
    proposalsHash: string;
    transactionsRoot: string;
    unclesHash: string;
    nonce: BI;
}
export declare const Header: import("./base").FixedBytesLikeCodec<_HeaderType, _HeaderType>;
export declare const ProposalShortId: FixedBytesCodec<string, string>;
export declare const ProposalShortIdVec: BytesCodec<string[], string[]>;
export declare const UncleBlock: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">>;
export declare const UncleBlockVec: BytesCodec<(Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">)[], (Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, never>> & Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    proposals: string[];
}, "header" | "proposals">)[]>;
export declare const Block: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
}, "header" | "proposals" | "uncles" | "transactions">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
}, "header" | "proposals" | "uncles" | "transactions">>;
export declare const BlockV1: BytesCodec<Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
    extension: string;
}, "header" | "proposals" | "uncles" | "transactions" | "extension">, Partial<Pick<{
    header: Partial<Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, never>> & Pick<{
        raw: Partial<Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, never>> & Pick<{
            version: number;
            compactTarget: number;
            timestamp: BI;
            number: BI;
            epoch: BI;
            parentHash: string;
            transactionsRoot: string;
            proposalsHash: string;
            extra_hash: string;
            dao: string;
        }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
        nonce: BI;
    }, "raw" | "nonce">;
    uncles: (Partial<Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, "raw" | "nonce">;
        proposals: string[];
    }, never>> & Pick<{
        header: Partial<Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
        }, never>> & Pick<{
            raw: Partial<Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, never>> & Pick<{
                version: number;
                compactTarget: number;
                timestamp: BI;
                number: BI;
                epoch: BI;
                parentHash: string;
                transactionsRoot: string;
                proposalsHash: string;
                extra_hash: string;
                dao: string;
            }, "number" | "version" | "compactTarget" | "timestamp" | "epoch" | "parentHash" | "transactionsRoot" | "proposalsHash" | "extra_hash" | "dao">;
            nonce: BI;
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
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
                depType: import("@ckb-lumos/base").DepType;
            }, never>> & Pick<{
                outPoint: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
                depType: import("@ckb-lumos/base").DepType;
            }, "outPoint" | "depType">)[];
            headerDeps: string[];
            inputs: (Partial<Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, never>> & Pick<{
                since: BI;
                previousOutput: Partial<Pick<{
                    txHash: string;
                    index: number;
                }, never>> & Pick<{
                    txHash: string;
                    index: number;
                }, "txHash" | "index">;
            }, "since" | "previousOutput">)[];
            outputs: (Partial<Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "type">> & Pick<{
                capacity: BI;
                lock: Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">;
                type: (Partial<Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, never>> & Pick<{
                    codeHash: string;
                    hashType: import("@ckb-lumos/base").HashType;
                    args: string;
                }, "codeHash" | "hashType" | "args">) | undefined;
            }, "capacity" | "lock">)[];
            outputsData: string[];
        }, "version" | "cellDeps" | "headerDeps" | "inputs" | "outputs" | "outputsData">;
        witnesses: string[];
    }, "raw" | "witnesses">)[];
    proposals: string[];
    extension: string;
}, "header" | "proposals" | "uncles" | "transactions" | "extension">>;
export declare const CellbaseWitness: BytesCodec<Partial<Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, never>> & Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, "message" | "lock">, Partial<Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, never>> & Pick<{
    lock: Partial<Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, never>> & Pick<{
        codeHash: string;
        hashType: import("@ckb-lumos/base").HashType;
        args: string;
    }, "codeHash" | "hashType" | "args">;
    message: string;
}, "message" | "lock">>;
