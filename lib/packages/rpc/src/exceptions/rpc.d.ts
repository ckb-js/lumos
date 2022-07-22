import ErrorCode from './ErrorCode';
export declare class IdNotMatchException extends Error {
    code: ErrorCode;
    constructor(requestId: number, responseId: number);
}
export declare class ResponseException extends Error {
    code: ErrorCode;
}
declare const _default: {
    IdNotMatchException: typeof IdNotMatchException;
    ResponseException: typeof ResponseException;
};
export default _default;
