import ErrorCode from "./ErrorCode";
export declare class PageSizeTooLargeException extends RangeError {
    code: ErrorCode;
    constructor(pageSize: bigint | string, maxSize: number);
}
export declare class PageSizeTooSmallException extends RangeError {
    code: ErrorCode;
    constructor(pageSize: bigint | string, minSize: number);
}
export declare class OutputsValidatorTypeException extends TypeError {
    code: ErrorCode;
    constructor();
}
export declare class BigintOrHexStringTypeException extends TypeError {
    code: ErrorCode;
    constructor(value: any);
}
export declare class StringHashTypeException extends TypeError {
    code: ErrorCode;
    constructor(hash: any);
}
export declare class HexStringWithout0xException extends Error {
    code: ErrorCode;
    constructor(hex: string);
}
declare const _default: {
    PageSizeTooLargeException: typeof PageSizeTooLargeException;
    PageSizeTooSmallException: typeof PageSizeTooSmallException;
    OutputsValidatorTypeException: typeof OutputsValidatorTypeException;
    BigintOrHexStringTypeException: typeof BigintOrHexStringTypeException;
    StringHashTypeException: typeof StringHashTypeException;
    HexStringWithout0xException: typeof HexStringWithout0xException;
};
export default _default;
