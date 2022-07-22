export declare function assertHexDecimal(str: string, byteLength?: number): void;
export declare function assertHexString(str: string, byteLength?: number): void;
export declare function assertUtf8String(str: string): void;
export declare function assertBufferLength(buf: {
    byteLength: number;
}, length: number): void;
export declare function assertMinBufferLength(buf: {
    byteLength: number;
}, length: number): void;
export declare function isObjectLike(x: unknown): x is Record<string, unknown>;
