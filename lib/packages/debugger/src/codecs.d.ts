export declare const OutPoint: import("@ckb-lumos/codec/lib/base").BytesCodec<Partial<Pick<{
    txHash: string;
    index: string;
}, never>> & Pick<{
    txHash: string;
    index: string;
}, "txHash" | "index">, Partial<Pick<{
    txHash: string;
    index: string;
}, never>> & Pick<{
    txHash: string;
    index: string;
}, "txHash" | "index">> & import("@ckb-lumos/codec/lib/base").BaseHeader;
export declare const OutPointVec: import("@ckb-lumos/codec/lib/base").BytesCodec<(Partial<Pick<{
    txHash: string;
    index: string;
}, never>> & Pick<{
    txHash: string;
    index: string;
}, "txHash" | "index">)[], (Partial<Pick<{
    txHash: string;
    index: string;
}, never>> & Pick<{
    txHash: string;
    index: string;
}, "txHash" | "index">)[]>;
