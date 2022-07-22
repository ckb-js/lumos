declare const _default: {
    sendTransaction: {
        method: string;
        paramsFormatters: (((transaction: import("../types/api").CKBComponents.RawTransaction) => import("../types/rpc").RPC.RawTransaction) | ((outputsValidator: import("../../lib/types/api").CKBComponents.OutputsValidator) => import("../../lib/types/api").CKBComponents.OutputsValidator))[];
        resultFormatters: (hash: string) => string;
    };
    txPoolInfo: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (info: import("../types/rpc").RPC.TxPoolInfo) => import("../types/api").CKBComponents.TxPoolInfo;
    };
    clearTxPool: {
        method: string;
        paramsFormatters: never[];
    };
    getRawTxPool: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (rawTxPool: import("../types/rpc").RPC.RawTxPool) => import("../types/api").CKBComponents.RawTxPool;
    };
};
export default _default;
