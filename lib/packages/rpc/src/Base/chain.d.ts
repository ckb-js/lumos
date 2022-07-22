declare const _default: {
    getTipBlockNumber: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (number: string) => string;
    };
    getTipHeader: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (header: import("../types/rpc").RPC.Header) => import("../types/api").CKBComponents.BlockHeader;
    };
    getCurrentEpoch: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (epoch: import("../types/rpc").RPC.Epoch) => import("../types/api").CKBComponents.Epoch;
    };
    getEpochByNumber: {
        method: string;
        paramsFormatters: ((number: string | bigint) => string)[];
        resultFormatters: (epoch: import("../types/rpc").RPC.Epoch) => import("../types/api").CKBComponents.Epoch;
    };
    getBlockHash: {
        method: string;
        paramsFormatters: ((number: string | bigint) => string)[];
    };
    getBlock: {
        method: string;
        paramsFormatters: ((hash: string) => string)[];
        resultFormatters: (block: import("../types/rpc").RPC.Block) => import("../types/api").CKBComponents.Block;
    };
    getBlockByNumber: {
        method: string;
        paramsFormatters: ((number: string | bigint) => string)[];
        resultFormatters: (block: import("../types/rpc").RPC.Block) => import("../types/api").CKBComponents.Block;
    };
    getHeader: {
        method: string;
        paramsFormatters: ((hash: string) => string)[];
        resultFormatters: (header: import("../types/rpc").RPC.Header) => import("../types/api").CKBComponents.BlockHeader;
    };
    getHeaderByNumber: {
        method: string;
        paramsFormatters: ((number: string | bigint) => string)[];
        resultFormatters: (header: import("../types/rpc").RPC.Header) => import("../types/api").CKBComponents.BlockHeader;
    };
    getLiveCell: {
        method: string;
        paramsFormatters: ((outPoint: import("../types/api").CKBComponents.OutPoint | undefined) => import("../types/rpc").RPC.OutPoint | undefined)[];
        resultFormatters: (cellWithStatus: {
            cell: import("../types/rpc").RPC.LiveCell;
            status: string;
        }) => {
            cell: import("../types/api").CKBComponents.LiveCell;
            status: string;
        };
    };
    getTransaction: {
        method: string;
        paramsFormatters: ((hash: string) => string)[];
        resultFormatters: (txWithStatus: import("../types/rpc").RPC.TransactionWithStatus) => {
            transaction: import("../types/api").CKBComponents.RawTransaction;
            txStatus: {
                blockHash: string | undefined;
                status: import("../types/rpc").RPC.TransactionStatus;
            };
        };
    };
    getCellbaseOutputCapacityDetails: {
        method: string;
        paramsFormatters: ((hash: string) => string)[];
        resultFormatters: (details: import("../types/rpc").RPC.CellbaseOutputCapacityDetails) => import("../types/api").CKBComponents.CellbaseOutputCapacityDetails;
    };
    getBlockEconomicState: {
        method: string;
        paramsFormatters: ((hash: string) => string)[];
        resultFormatters: (blockEconomicState: import("../types/rpc").RPC.BlockEconomicState) => import("../types/api").CKBComponents.BlockEconomicState;
    };
    getTransactionProof: {
        method: string;
        paramsFormatters: ((arg: any) => any)[];
        resultFormatters: (proof: import("../types/rpc").RPC.TransactionProof) => import("../types/api").CKBComponents.TransactionProof;
    };
    verifyTransactionProof: {
        method: string;
        paramsFormatters: ((proof: import("../types/api").CKBComponents.TransactionProof) => import("../types/rpc").RPC.TransactionProof)[];
    };
    getConsensus: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (consensus: import("../types/rpc").RPC.Consensus) => import("../types/api").CKBComponents.Consensus;
    };
};
export default _default;
