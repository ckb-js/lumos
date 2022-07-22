import { CKBComponents } from './types/api';
import { RPC } from './types/rpc';
declare function toTransaction(tx: RPC.RawTransaction): CKBComponents.RawTransaction;
declare function toTransaction(tx: RPC.Transaction): CKBComponents.Transaction;
declare const _default: {
    toNumber: (number: string) => string;
    toHash: (hash: string) => string;
    toHeader: (header: RPC.Header) => CKBComponents.BlockHeader;
    toScript: (script: RPC.Script) => CKBComponents.Script;
    toInput: (input: RPC.CellInput) => CKBComponents.CellInput;
    toOutput: (output: RPC.CellOutput) => CKBComponents.CellOutput;
    toOutPoint: (outPoint: RPC.OutPoint | undefined) => CKBComponents.OutPoint | undefined;
    toDepType: (type: import("../lib/types/rpc").RPC.DepType) => "code" | "depGroup";
    toCellDep: (cellDep: RPC.CellDep) => CKBComponents.CellDep;
    toTransaction: typeof toTransaction;
    toUncleBlock: (uncleBlock: RPC.UncleBlock) => CKBComponents.UncleBlock;
    toBlock: (block: RPC.Block) => CKBComponents.Block;
    toAlertMessage: (alertMessage: RPC.AlertMessage) => CKBComponents.AlertMessage;
    toBlockchainInfo: (info: RPC.BlockchainInfo) => CKBComponents.BlockchainInfo;
    toLocalNodeInfo: (info: RPC.LocalNodeInfo) => CKBComponents.LocalNodeInfo;
    toRemoteNodeInfo: (info: RPC.RemoteNodeInfo) => CKBComponents.RemoteNodeInfo;
    toTxPoolInfo: (info: RPC.TxPoolInfo) => CKBComponents.TxPoolInfo;
    toPeers: (nodes: RPC.RemoteNodeInfo[]) => CKBComponents.RemoteNodeInfo[];
    toLiveCell: (liveCell: RPC.LiveCell) => CKBComponents.LiveCell;
    toLiveCellWithStatus: (cellWithStatus: {
        cell: RPC.LiveCell;
        status: string;
    }) => {
        cell: CKBComponents.LiveCell;
        status: string;
    };
    toCell: (cell: RPC.CellOutput) => CKBComponents.Cell;
    toCells: (cells: RPC.CellOutput[]) => CKBComponents.Cell[];
    toCellIncludingOutPoint: (cell: RPC.CellIncludingOutPoint) => {
        capacity: string;
        cellbase: boolean;
        blockHash: string;
        lock: CKBComponents.Script;
        outPoint: CKBComponents.OutPoint | undefined;
        outputDataLen: string;
    };
    toCellsIncludingOutPoint: (cells: RPC.CellIncludingOutPoint[]) => CKBComponents.CellIncludingOutPoint[];
    toTransactionWithStatus: (txWithStatus: RPC.TransactionWithStatus) => {
        transaction: CKBComponents.RawTransaction;
        txStatus: {
            blockHash: string | undefined;
            status: RPC.TransactionStatus;
        };
    };
    toEpoch: (epoch: RPC.Epoch) => CKBComponents.Epoch;
    toTransactionPoint: (transactionPoint: RPC.TransactionPoint) => CKBComponents.TransactionPoint;
    toTransactionsByLockHash: (transactions: RPC.TransactionsByLockHash) => CKBComponents.TransactionsByLockHash;
    toLiveCellsByLockHash: (cells: RPC.LiveCellsByLockHash) => CKBComponents.LiveCellsByLockHash;
    toLockHashIndexState: (index: RPC.LockHashIndexState) => CKBComponents.LockHashIndexState;
    toLockHashIndexStates: (states: RPC.LockHashIndexStates) => CKBComponents.LockHashIndexStates;
    toBannedAddress: (bannedAddress: RPC.BannedAddress) => CKBComponents.BannedAddress;
    toBannedAddresses: (bannedAddresses: RPC.BannedAddresses) => CKBComponents.BannedAddresses;
    toCellbaseOutputCapacityDetails: (details: RPC.CellbaseOutputCapacityDetails) => CKBComponents.CellbaseOutputCapacityDetails;
    toFeeRate: (feeRateObj: RPC.FeeRate) => CKBComponents.FeeRate;
    toCapacityByLockHash: (capacityByLockHash: RPC.CapacityByLockHash) => CKBComponents.CapacityByLockHash;
    toBlockEconomicState: (blockEconomicState: RPC.BlockEconomicState) => CKBComponents.BlockEconomicState;
    toSyncState: (state: RPC.SyncState) => CKBComponents.SyncState;
    toTransactionProof: (proof: RPC.TransactionProof) => CKBComponents.TransactionProof;
    toConsensus: (consensus: RPC.Consensus) => CKBComponents.Consensus;
    toRawTxPool: (rawTxPool: RPC.RawTxPool) => CKBComponents.RawTxPool;
};
export default _default;
