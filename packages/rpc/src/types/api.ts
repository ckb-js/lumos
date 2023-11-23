import type * as api from "@ckb-lumos/base";

/**
 * @see https://github.com/nervosnetwork/ckb/blob/develop/protocol/src/protocol.fbs for more infGomation
 */
/* eslint-disable  @typescript-eslint/no-namespace,  @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types  */
export namespace CKBComponents {
  export type DAO = string;
  export type Hash = string;
  export type Number = string;
  export type Hash256 = string;
  export type UInt32 = string;
  export type UInt64 = string;
  export type U256 = string;

  export type Index = string;
  export type Version = string;
  export type Count = string;
  export type Difficulty = string;
  export type BlockNumber = string;
  export type EpochInHeader = string;
  export type Capacity = string;
  export type ProposalShortId = string;
  export type Timestamp = string;
  export type Nonce = string;
  export type Cycles = string;
  export type Size = string;
  export type OutputsValidator = "default" | "passthrough" | undefined;
  export type RationalU256 = Record<"denom" | "numer", string>;
  export type ProposalWindow = Record<"closest" | "farthest", BlockNumber>;
  export type EpochNumberWithFraction = string;
  export type EpochNumber = string;
  export enum TransactionStatus {
    Pending = "pending",
    Proposed = "proposed",
    Committed = "committed",
  }

  export type ScriptHashType = api.HashType;

  export type DepType = "code" | "depGroup";
  export type JsonBytes = string;

  /**
   * @typedef Bytes, keep consistent with CKB
   * @description Bytes will be serialized to string
   * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs#L19
   */
  export type Bytes = string;
  export type Since = string;
  export interface Node {
    url: string;
    httpAgent?: any;
    httpsAgent?: any;
  }
  export interface Method {
    name: string;
    method: string;
    paramsFormatters: Function[];
    resultFormatters?: Function;
  }
  /**
   * RPC Units
   */
  export type Witness = Bytes;

  export type Script = api.Script;
  export type CellInput = api.Input;
  export type CellOutput = api.Output;
  export type Cell = CellOutput;
  export type OutPoint = api.OutPoint;
  export type CellDep = api.CellDep;
  export type RawTransaction = api.RawTransaction & { witnesses: Witness[] };
  export type Transaction = Required<api.Transaction>;
  export type TransactionWithStatus<Tx = Transaction> =
    api.TransactionWithStatus<Tx>;
  export type BlockHeader<T = api.Header> = T;
  export type Block = api.Block;
  export type UncleBlock = api.UncleBlock;
  export type LiveCell = api.LiveCell;
  export type AlertMessage = api.AlertMessage;
  export type BlockchainInfo = api.ChainInfo;
  export type LocalNodeInfo = api.LocalNode;
  export type RemoteNodeInfo = api.RemoteNode;
  export type TxPoolInfo = api.TxPoolInfo;
  export type Epoch = api.Epoch;
  export type RunDryResult = api.DryRunResult;
  export type BannedAddress = api.BannedAddr;
  export type WitnessArgs = api.WitnessArgs;
  export type BlockEconomicState = api.BlockEconomicState;
  export type SyncState = api.SyncState;
  export type TransactionProof = api.TransactionProof;
  export type TxVerbosity = api.TxVerbosity;
  export type TxPoolVerbosity = api.TxPoolVerbosity;
  export type RawTxPool = api.RawTxPool;
  export type Consensus = api.Consensus;
  export type HardForks = api.HardForks;
  export type HardForkFeature = api.HardforkFeature;
  export type SoftForkStatus = api.SoftForkStatus;
  export type SoftFork = api.SoftFork;
  export type Buried = api.Buried;
  export type Rfc0043 = api.Rfc0043;
  export type Ratio = api.Ratio;
  export type Deployment = api.Deployment;
  export type QueryOptions = api.QueryOptions;

  export interface TransactionPoint {
    blockNumber: BlockNumber;
    index: Index;
    txHash: Hash256;
  }
  export interface TransactionByLockHash {
    consumedBy: undefined | TransactionPoint;
    createdBy: TransactionPoint;
  }

  export type TransactionsByLockHash = TransactionByLockHash[];

  export interface FeeRate {
    feeRate: string;
  }
  export interface CellIncludingOutPoint {
    blockHash: Hash256;
    capacity: Capacity;
    lock: Script;
    outPoint: OutPoint;
    cellbase: boolean;
    outputDataLen: string;
  }

  export type TransactionTrace = {
    action: string;
    info: string;
    time: Timestamp;
  }[];

  export enum CellStatus {
    Live = "live",
    Unknown = "unknown",
  }

  export interface LiveCellByLockHash {
    cellOutput: CellOutput;
    createdBy: TransactionPoint;
    cellbase: boolean;
    outputDataLen: string;
  }

  export type LiveCellsByLockHash = LiveCellByLockHash[];

  export interface PeersState {
    lastUpdated: string;
    blocksInFlight: string;
    peer: string;
  }

  export interface LockHashIndexState {
    blockHash: Hash256;
    blockNumber: BlockNumber;
    lockHash: Hash256;
  }

  export type LockHashIndexStates = LockHashIndexState[];

  export type BannedAddresses = BannedAddress[];

  export interface CellbaseOutputCapacityDetails {
    primary: string;
    proposalReward: string;
    secondary: string;
    total: string;
    txFee: string;
  }

  export interface RawTransactionToSign
    extends Omit<RawTransaction, "witnesses"> {
    witnesses: (WitnessArgs | Witness)[];
  }

  export interface CapacityByLockHash {
    blockNumber: BlockNumber;
    capacity: Capacity;
    cellsCount: string;
  }

  export type TxPoolIds = Record<"pending" | "proposed", Array<Hash256>>;
  export interface Tip {
    blockNumber: BlockNumber;
    blockHash: Hash256;
  }

  export type ScriptType = "type" | "lock";
  export type Order = "asc" | "desc";
  export type IOType = "input" | "output" | "both";
  export type ScriptSearchMode = "prefix" | "exact";

  export interface IndexerCell {
    blockNumber: BlockNumber;
    outPoint: OutPoint;
    output: {
      capacity: Capacity;
      lock: Script;
      type?: Script;
    };
    outputData: string;
    txIndex: string;
  }

  export interface IndexerCellWithoutData
    extends Omit<IndexerCell, "outputData"> {
    outputData: null;
  }

  export interface GetCellsResult<WithData extends boolean = true> {
    lastCursor: string;
    objects: WithData extends true ? IndexerCell[] : IndexerCellWithoutData[];
  }

  export type IndexerTransaction<Goruped extends boolean = false> =
    Goruped extends true
      ? GroupedIndexerTransaction
      : UngroupedIndexerTransaction;

  export type UngroupedIndexerTransaction = {
    txHash: Hash256;
    blockNumber: BlockNumber;
    ioIndex: Number;
    ioType: IOType;
    txIndex: Number;
  };

  export type GroupedIndexerTransaction = {
    txHash: Hash256;
    blockNumber: BlockNumber;
    txIndex: Number;
    cells: Array<[IOType, Number]>;
  };

  export interface GetTransactionsResult<Goruped extends boolean = false> {
    lastCursor: Hash256;
    objects: IndexerTransaction<Goruped>[];
  }

  export interface CKBIndexerQueryOptions extends QueryOptions {
    outputDataLenRange?: HexadecimalRange;
    outputCapacityRange?: HexadecimalRange;
    scriptLenRange?: HexadecimalRange;
    bufferSize?: number;
    withData?: boolean;
    groupByTransaction?: boolean;
  }

  export type HexadecimalRange = [string, string];
  export interface SearchFilter {
    script?: Script;
    scriptLenRange?: HexadecimalRange;
    outputDataLenRange?: HexadecimalRange; //empty
    outputCapacityRange?: HexadecimalRange; //empty
    blockRange?: HexadecimalRange; //fromBlock-toBlock
  }
  export interface SearchKey {
    script: Script;
    scriptType: ScriptType;
    filter?: SearchFilter;
    scriptSearchMode?: ScriptSearchMode;
  }
  export interface GetLiveCellsResult<WithData extends boolean = true> {
    lastCursor: string;
    objects: WithData extends true ? IndexerCell[] : IndexerCellWithoutData[];
  }

  export interface GetCellsSearchKey<WithData extends boolean = boolean>
    extends SearchKey {
    withData?: WithData;
  }

  export interface GetTransactionsSearchKey<Group extends boolean = boolean>
    extends SearchKey {
    groupByTransaction?: Group;
  }

  export interface CellsCapacity {
    capacity: Capacity;
    blockHash: Hash256;
    blockNumber: BlockNumber;
  }

  export interface BlockFilter {
    data: api.HexString;
    hash: api.Hash;
  }

  export interface TransactionAndWitnessProof {
    blockHash: Hash256;
    transactionsProof: api.MerkleProof;
    witnessesProof: api.MerkleProof;
  }

  export type TransactionView = api.Transaction & { hash: api.Hash };

  export interface BlockView {
    header: BlockHeader;
    uncles: UncleBlock[];
    transactions: TransactionView[];
    proposals: ProposalShortId[];
    extension: Hash;
  }

  export type SerializedBlock = api.HexString;

  export interface FeeRateStatistics {
    mean: UInt64;
    median: UInt64;
  }

  export interface EstimateCycles {
    cycles: UInt64;
  }

  export type DeploymentPos = api.DeploymentPos;
  export type DeploymentState = api.DeploymentState;
  export type DeploymentInfo = api.DeploymentInfo;
  export type DeploymentsInfo = api.DeploymentsInfo;
}
