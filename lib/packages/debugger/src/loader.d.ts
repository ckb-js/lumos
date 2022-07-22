import { HexString, OutPoint } from "@ckb-lumos/base";
export declare type LoadedCode = {
    codeHash: HexString;
    binary: HexString;
};
export declare function loadCode(binaryPath: string): LoadedCode;
export declare class OutputDataLoader {
    private readonly cache;
    constructor();
    setCode(outPoint: OutPoint, path: string): LoadedCode;
    setOutpointVec(outPoint: OutPoint, outPoints: OutPoint[]): void;
    getOutputData(outPoint: OutPoint): HexString | undefined;
}
