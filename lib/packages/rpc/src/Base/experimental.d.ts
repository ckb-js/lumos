declare const _default: {
    dryRunTransaction: {
        method: string;
        paramsFormatters: ((transaction: import("../types/api").CKBComponents.RawTransaction) => import("../types/rpc").RPC.RawTransaction)[];
    };
    calculateDaoMaximumWithdraw: {
        method: string;
        paramsFormatters: (((hash: string) => string) | ((outPoint: import("../types/api").CKBComponents.OutPoint | undefined) => import("../types/rpc").RPC.OutPoint | undefined))[];
    };
};
export default _default;
