import ErrorCode from './ErrorCode';
import { IdNotMatchException } from './rpc';
export declare class MethodInBatchNotFoundException extends Error {
    code: ErrorCode;
    constructor(name: string);
}
export declare class PayloadInBatchException extends Error {
    code: ErrorCode;
    index: number | undefined;
    constructor(index: number, message: string);
}
export declare class IdNotMatchedInBatchException extends IdNotMatchException {
    index: number | undefined;
    constructor(index: number, requestId: number, responseId: number);
}
declare const _default: {
    MethodInBatchNotFoundException: typeof MethodInBatchNotFoundException;
    PayloadInBatchException: typeof PayloadInBatchException;
    IdNotMatchedInBatchException: typeof IdNotMatchedInBatchException;
};
export default _default;
