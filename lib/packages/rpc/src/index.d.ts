import Base from './Base';
import Method from './method';
import { CKBComponents } from './types/api';
export declare const ParamsFormatter: {
    toOptional: (format?: Function | undefined) => (arg: any) => any;
    toArray: (format?: ((args: any) => any) | undefined) => (arg: any) => any;
    toHash: (hash: string) => string;
    toNumber: (number: string | bigint) => string;
    toScript: (script: CKBComponents.Script) => import("./types/rpc").RPC.Script;
    toOutPoint: (outPoint: CKBComponents.OutPoint | undefined) => import("./types/rpc").RPC.OutPoint | undefined;
    toInput: (input: CKBComponents.CellInput) => import("./types/rpc").RPC.CellInput;
    toOutput: (output: CKBComponents.CellOutput) => import("./types/rpc").RPC.CellOutput;
    toDepType: (type: import("@ckb-lumos/base").DepType) => "code" | "dep_group";
    toCellDep: (cellDep: CKBComponents.CellDep) => import("./types/rpc").RPC.CellDep;
    toRawTransaction: (transaction: CKBComponents.RawTransaction) => import("./types/rpc").RPC.RawTransaction;
    toPageNumber: (pageNo?: string | bigint) => string;
    toPageSize: (pageSize?: string | bigint) => string;
    toReverseOrder: (reverse?: boolean) => boolean;
    toOutputsValidator: (outputsValidator: import("../lib/types/api").CKBComponents.OutputsValidator) => import("../lib/types/api").CKBComponents.OutputsValidator;
    toBoolean: (value: boolean) => boolean;
    toTransactionProof: (proof: CKBComponents.TransactionProof) => import("./types/rpc").RPC.TransactionProof;
};
export declare const ResultFormatter: {
    toNumber: (number: string) => string;
    toHash: (hash: string) => string;
    toHeader: (header: import("./types/rpc").RPC.Header) => CKBComponents.BlockHeader;
    toScript: (script: import("./types/rpc").RPC.Script) => CKBComponents.Script;
    toInput: (input: import("./types/rpc").RPC.CellInput) => CKBComponents.CellInput;
    toOutput: (output: import("./types/rpc").RPC.CellOutput) => CKBComponents.CellOutput;
    toOutPoint: (outPoint: import("./types/rpc").RPC.OutPoint | undefined) => CKBComponents.OutPoint | undefined;
    toDepType: (type: import("../lib/types/rpc").RPC.DepType) => "code" | "depGroup";
    toCellDep: (cellDep: import("./types/rpc").RPC.CellDep) => CKBComponents.CellDep;
    toTransaction: {
        (tx: import("./types/rpc").RPC.RawTransaction): CKBComponents.RawTransaction;
        (tx: import("./types/rpc").RPC.Transaction): CKBComponents.Transaction;
    };
    toUncleBlock: (uncleBlock: import("./types/rpc").RPC.UncleBlock) => CKBComponents.UncleBlock;
    toBlock: (block: import("./types/rpc").RPC.Block) => CKBComponents.Block;
    toAlertMessage: (alertMessage: import("./types/rpc").RPC.AlertMessage) => CKBComponents.AlertMessage;
    toBlockchainInfo: (info: import("./types/rpc").RPC.BlockchainInfo) => CKBComponents.BlockchainInfo;
    toLocalNodeInfo: (info: import("./types/rpc").RPC.LocalNodeInfo) => CKBComponents.LocalNodeInfo;
    toRemoteNodeInfo: (info: import("./types/rpc").RPC.RemoteNodeInfo) => CKBComponents.RemoteNodeInfo;
    toTxPoolInfo: (info: import("./types/rpc").RPC.TxPoolInfo) => CKBComponents.TxPoolInfo;
    toPeers: (nodes: import("./types/rpc").RPC.RemoteNodeInfo[]) => CKBComponents.RemoteNodeInfo[];
    toLiveCell: (liveCell: import("./types/rpc").RPC.LiveCell) => CKBComponents.LiveCell;
    toLiveCellWithStatus: (cellWithStatus: {
        cell: import("./types/rpc").RPC.LiveCell;
        status: string;
    }) => {
        cell: CKBComponents.LiveCell;
        status: string;
    };
    toCell: (cell: import("./types/rpc").RPC.CellOutput) => CKBComponents.Cell;
    toCells: (cells: import("./types/rpc").RPC.CellOutput[]) => CKBComponents.Cell[];
    toCellIncludingOutPoint: (cell: import("./types/rpc").RPC.CellIncludingOutPoint) => {
        capacity: string;
        cellbase: boolean;
        blockHash: string;
        lock: CKBComponents.Script;
        outPoint: CKBComponents.OutPoint | undefined;
        outputDataLen: string;
    };
    toCellsIncludingOutPoint: (cells: import("./types/rpc").RPC.CellIncludingOutPoint[]) => CKBComponents.CellIncludingOutPoint[];
    toTransactionWithStatus: (txWithStatus: import("./types/rpc").RPC.TransactionWithStatus) => {
        transaction: CKBComponents.RawTransaction;
        txStatus: {
            blockHash: string | undefined;
            status: import("./types/rpc").RPC.TransactionStatus;
        };
    };
    toEpoch: (epoch: import("./types/rpc").RPC.Epoch) => CKBComponents.Epoch;
    toTransactionPoint: (transactionPoint: import("./types/rpc").RPC.TransactionPoint) => CKBComponents.TransactionPoint;
    toTransactionsByLockHash: (transactions: import("./types/rpc").RPC.TransactionsByLockHash) => CKBComponents.TransactionsByLockHash;
    toLiveCellsByLockHash: (cells: import("./types/rpc").RPC.LiveCellsByLockHash) => CKBComponents.LiveCellsByLockHash;
    toLockHashIndexState: (index: import("./types/rpc").RPC.LockHashIndexState) => CKBComponents.LockHashIndexState;
    toLockHashIndexStates: (states: import("./types/rpc").RPC.LockHashIndexStates) => CKBComponents.LockHashIndexStates;
    toBannedAddress: (bannedAddress: import("./types/rpc").RPC.BannedAddress) => CKBComponents.BannedAddress;
    toBannedAddresses: (bannedAddresses: import("./types/rpc").RPC.BannedAddresses) => CKBComponents.BannedAddresses;
    toCellbaseOutputCapacityDetails: (details: import("./types/rpc").RPC.CellbaseOutputCapacityDetails) => CKBComponents.CellbaseOutputCapacityDetails;
    toFeeRate: (feeRateObj: import("./types/rpc").RPC.FeeRate) => CKBComponents.FeeRate;
    toCapacityByLockHash: (capacityByLockHash: import("./types/rpc").RPC.CapacityByLockHash) => CKBComponents.CapacityByLockHash;
    toBlockEconomicState: (blockEconomicState: import("./types/rpc").RPC.BlockEconomicState) => CKBComponents.BlockEconomicState;
    toSyncState: (state: import("./types/rpc").RPC.SyncState) => CKBComponents.SyncState;
    toTransactionProof: (proof: import("./types/rpc").RPC.TransactionProof) => CKBComponents.TransactionProof;
    toConsensus: (consensus: import("./types/rpc").RPC.Consensus) => CKBComponents.Consensus;
    toRawTxPool: (rawTxPool: import("./types/rpc").RPC.RawTxPool) => CKBComponents.RawTxPool;
};
declare class CKBRPC extends Base {
    #private;
    get node(): CKBComponents.Node;
    get paramsFormatter(): {
        toOptional: (format?: Function | undefined) => (arg: any) => any;
        toArray: (format?: ((args: any) => any) | undefined) => (arg: any) => any;
        toHash: (hash: string) => string;
        toNumber: (number: string | bigint) => string;
        toScript: (script: CKBComponents.Script) => import("./types/rpc").RPC.Script;
        toOutPoint: (outPoint: CKBComponents.OutPoint | undefined) => import("./types/rpc").RPC.OutPoint | undefined;
        toInput: (input: CKBComponents.CellInput) => import("./types/rpc").RPC.CellInput;
        toOutput: (output: CKBComponents.CellOutput) => import("./types/rpc").RPC.CellOutput;
        toDepType: (type: import("@ckb-lumos/base").DepType) => "code" | "dep_group";
        toCellDep: (cellDep: CKBComponents.CellDep) => import("./types/rpc").RPC.CellDep;
        toRawTransaction: (transaction: CKBComponents.RawTransaction) => import("./types/rpc").RPC.RawTransaction;
        toPageNumber: (pageNo?: string | bigint) => string;
        toPageSize: (pageSize?: string | bigint) => string;
        toReverseOrder: (reverse?: boolean) => boolean;
        toOutputsValidator: (outputsValidator: import("../lib/types/api").CKBComponents.OutputsValidator) => import("../lib/types/api").CKBComponents.OutputsValidator;
        toBoolean: (value: boolean) => boolean;
        toTransactionProof: (proof: CKBComponents.TransactionProof) => import("./types/rpc").RPC.TransactionProof;
    };
    get resultFormatter(): {
        toNumber: (number: string) => string;
        toHash: (hash: string) => string;
        toHeader: (header: import("./types/rpc").RPC.Header) => CKBComponents.BlockHeader;
        toScript: (script: import("./types/rpc").RPC.Script) => CKBComponents.Script;
        toInput: (input: import("./types/rpc").RPC.CellInput) => CKBComponents.CellInput;
        toOutput: (output: import("./types/rpc").RPC.CellOutput) => CKBComponents.CellOutput;
        toOutPoint: (outPoint: import("./types/rpc").RPC.OutPoint | undefined) => CKBComponents.OutPoint | undefined;
        toDepType: (type: import("../lib/types/rpc").RPC.DepType) => "code" | "depGroup";
        toCellDep: (cellDep: import("./types/rpc").RPC.CellDep) => CKBComponents.CellDep;
        toTransaction: {
            (tx: import("./types/rpc").RPC.RawTransaction): CKBComponents.RawTransaction;
            (tx: import("./types/rpc").RPC.Transaction): CKBComponents.Transaction;
        };
        toUncleBlock: (uncleBlock: import("./types/rpc").RPC.UncleBlock) => CKBComponents.UncleBlock;
        toBlock: (block: import("./types/rpc").RPC.Block) => CKBComponents.Block;
        toAlertMessage: (alertMessage: import("./types/rpc").RPC.AlertMessage) => CKBComponents.AlertMessage;
        toBlockchainInfo: (info: import("./types/rpc").RPC.BlockchainInfo) => CKBComponents.BlockchainInfo;
        toLocalNodeInfo: (info: import("./types/rpc").RPC.LocalNodeInfo) => CKBComponents.LocalNodeInfo;
        toRemoteNodeInfo: (info: import("./types/rpc").RPC.RemoteNodeInfo) => CKBComponents.RemoteNodeInfo;
        toTxPoolInfo: (info: import("./types/rpc").RPC.TxPoolInfo) => CKBComponents.TxPoolInfo;
        toPeers: (nodes: import("./types/rpc").RPC.RemoteNodeInfo[]) => CKBComponents.RemoteNodeInfo[];
        toLiveCell: (liveCell: import("./types/rpc").RPC.LiveCell) => CKBComponents.LiveCell;
        toLiveCellWithStatus: (cellWithStatus: {
            cell: import("./types/rpc").RPC.LiveCell;
            status: string;
        }) => {
            cell: CKBComponents.LiveCell;
            status: string;
        };
        toCell: (cell: import("./types/rpc").RPC.CellOutput) => CKBComponents.Cell;
        toCells: (cells: import("./types/rpc").RPC.CellOutput[]) => CKBComponents.Cell[];
        toCellIncludingOutPoint: (cell: import("./types/rpc").RPC.CellIncludingOutPoint) => {
            capacity: string;
            cellbase: boolean;
            blockHash: string;
            lock: CKBComponents.Script;
            outPoint: CKBComponents.OutPoint | undefined;
            outputDataLen: string;
        };
        toCellsIncludingOutPoint: (cells: import("./types/rpc").RPC.CellIncludingOutPoint[]) => CKBComponents.CellIncludingOutPoint[];
        toTransactionWithStatus: (txWithStatus: import("./types/rpc").RPC.TransactionWithStatus) => {
            transaction: CKBComponents.RawTransaction;
            txStatus: {
                blockHash: string | undefined;
                status: import("./types/rpc").RPC.TransactionStatus;
            };
        };
        toEpoch: (epoch: import("./types/rpc").RPC.Epoch) => CKBComponents.Epoch;
        toTransactionPoint: (transactionPoint: import("./types/rpc").RPC.TransactionPoint) => CKBComponents.TransactionPoint;
        toTransactionsByLockHash: (transactions: import("./types/rpc").RPC.TransactionsByLockHash) => CKBComponents.TransactionsByLockHash;
        toLiveCellsByLockHash: (cells: import("./types/rpc").RPC.LiveCellsByLockHash) => CKBComponents.LiveCellsByLockHash;
        toLockHashIndexState: (index: import("./types/rpc").RPC.LockHashIndexState) => CKBComponents.LockHashIndexState;
        toLockHashIndexStates: (states: import("./types/rpc").RPC.LockHashIndexStates) => CKBComponents.LockHashIndexStates;
        toBannedAddress: (bannedAddress: import("./types/rpc").RPC.BannedAddress) => CKBComponents.BannedAddress;
        toBannedAddresses: (bannedAddresses: import("./types/rpc").RPC.BannedAddresses) => CKBComponents.BannedAddresses;
        toCellbaseOutputCapacityDetails: (details: import("./types/rpc").RPC.CellbaseOutputCapacityDetails) => CKBComponents.CellbaseOutputCapacityDetails;
        toFeeRate: (feeRateObj: import("./types/rpc").RPC.FeeRate) => CKBComponents.FeeRate;
        toCapacityByLockHash: (capacityByLockHash: import("./types/rpc").RPC.CapacityByLockHash) => CKBComponents.CapacityByLockHash;
        toBlockEconomicState: (blockEconomicState: import("./types/rpc").RPC.BlockEconomicState) => CKBComponents.BlockEconomicState;
        toSyncState: (state: import("./types/rpc").RPC.SyncState) => CKBComponents.SyncState;
        toTransactionProof: (proof: import("./types/rpc").RPC.TransactionProof) => CKBComponents.TransactionProof;
        toConsensus: (consensus: import("./types/rpc").RPC.Consensus) => CKBComponents.Consensus;
        toRawTxPool: (rawTxPool: import("./types/rpc").RPC.RawTxPool) => CKBComponents.RawTxPool;
    };
    constructor(url: string);
    setNode(node: CKBComponents.Node): CKBComponents.Node;
    addMethod: (options: CKBComponents.Method) => void;
    createBatchRequest: <N extends "getTipBlockNumber" | "getTipHeader" | "getCurrentEpoch" | "getEpochByNumber" | "getBlockHash" | "getBlock" | "getHeader" | "getHeaderByNumber" | "getLiveCell" | "getTransaction" | "getCellbaseOutputCapacityDetails" | "getBlockEconomicState" | "getTransactionProof" | "verifyTransactionProof" | "getConsensus" | "getBlockByNumber" | "dryRunTransaction" | "calculateDaoMaximumWithdraw" | "localNodeInfo" | "getPeers" | "getBannedAddresses" | "clearBannedAddresses" | "setBan" | "syncState" | "setNetworkActive" | "addNode" | "removeNode" | "pingPeers" | "sendTransaction" | "txPoolInfo" | "clearTxPool" | "getRawTxPool" | "getBlockchainInfo" | "rpcProperties", P extends (string | number | object)[], R = any[]>(params?: any) => any;
}
export default CKBRPC;
