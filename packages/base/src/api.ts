// TODO: this file is a copy of jsonrpc-types/src/blockchain.rs
//  it provides some basic types for RPC, also for Lumos,
//  but it is not a good idea to use these types directly,
//  RPC types are not stable, Lumos is better to define its own types
//  instead of using the RPC types in the future, the api.ts is a legacy solution.
//  To map the RPC types, it is better to 1:1 map the `jsonrpc-types` from the ckb repo,
//  at https://github.com/nervosnetwork/ckb/tree/develop/util/jsonrpc-types/src
//  with the same directory structure.

import {
  Hash,
  Hexadecimal,
  HexNumber,
  HexString,
  PackedSince,
} from "./primitive";

export interface Header {
  timestamp: HexNumber;
  number: HexNumber;
  epoch: HexNumber;
  compactTarget: HexNumber;
  dao: Hash;
  hash: Hash;
  nonce: HexNumber;
  parentHash: Hash;
  proposalsHash: Hash;
  transactionsRoot: Hash;
  extraHash: Hash;
  version: HexNumber;
}

export type HashType = "type" | "data" | "data1" | "data2";
export interface Script {
  codeHash: Hash;
  hashType: HashType;
  args: HexString;
}

export interface OutPoint {
  txHash: Hash;
  index: HexNumber;
}

export type DepType = "depGroup" | "code";
export interface CellDep {
  outPoint: OutPoint;
  depType: DepType;
}

export interface Input {
  previousOutput: OutPoint;
  since: PackedSince;
}

export interface Output {
  capacity: HexString;
  lock: Script;
  type?: Script;
}

export interface WitnessArgs {
  lock?: HexString;
  inputType?: HexString;
  outputType?: HexString;
}
export interface RawTransaction {
  cellDeps: CellDep[];
  hash?: Hash;
  headerDeps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputsData: HexString[];
  version: HexString;
}
export interface Transaction {
  cellDeps: CellDep[];
  hash?: Hash;
  headerDeps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputsData: HexString[];
  version: HexNumber;
  witnesses: HexString[];
}

export interface TxStatus {
  blockHash?: Hash;
  status: string;
}

export interface TransactionWithStatus<Tx = Transaction> {
  transaction: Tx;
  txStatus: TxStatus;
  timeAddedToPool: Uint64 | null;
  cycles: Uint64 | null;
}

export interface Cell {
  cellOutput: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
  data: HexString;
  outPoint?: OutPoint;
  blockHash?: Hash;
  blockNumber?: HexNumber;
  txIndex?: HexNumber;
}

export interface UncleBlock {
  header: Header;
  proposals: HexString[];
}

export interface Block {
  header: Header;
  transactions: Transaction[];
  uncles: UncleBlock[];
  proposals: HexString[];
}

export interface LiveCell {
  data: {
    content: HexString;
    hash: Hash;
  };
  output: Output;
}
export interface CellWithStatus {
  cell: LiveCell | null;
  status: "live" | "unknown";
}

export interface Epoch {
  compactTarget: HexNumber;
  length: HexNumber;
  startNumber: HexNumber;
  number: HexNumber;
}

export interface BlockEconomicState {
  issuance: {
    primary: HexNumber;
    secondary: HexNumber;
  };
  minerReward: {
    primary: HexNumber;
    secondary: HexNumber;
    committed: HexNumber;
    proposal: HexNumber;
  };
  txsFee: HexNumber;
  finalizedAt: Hash;
}

export interface MerkleProof {
  indices: HexNumber[];
  lemmas: Hash[];
}

export interface TransactionProof {
  blockHash: Hash;
  witnessesRoot: Hash;
  proof: MerkleProof;
}

export interface Rational {
  denom: HexNumber;
  numer: HexNumber;
}

export interface ProposalWindow {
  closest: HexNumber;
  farthest: HexNumber;
}

export interface Consensus {
  id: string;
  genesisHash: Hash;
  daoTypeHash?: Hash;
  secp256k1Blake160SighashAllTypeHash?: Hash;
  secp256k1Blake160MultisigAllTypeHash?: Hash;
  initialPrimaryEpochReward: HexNumber;
  secondaryEpochReward: HexNumber;
  maxUnclesNum: HexNumber;
  orphanRateTarget: Rational;
  epochDurationTarget: HexNumber;
  txProposalWindow: ProposalWindow;
  proposerRewardRatio: Rational;
  cellbaseMaturity: HexNumber;
  medianTimeBlockCount: HexNumber;
  maxBlockCycles: HexNumber;
  maxBlockBytes: HexNumber;
  blockVersion: HexNumber;
  txVersion: HexNumber;
  typeIdCodeHash: Hash;
  maxBlockProposalsLimit: HexNumber;
  primaryEpochRewardHalvingInterval: HexNumber;
  permanentDifficultyInDummy: boolean;
  // added this field by: https://github.com/nervosnetwork/ckb/pull/2879
  hardforkFeatures: HardForks;
  softforks: MapLike<DeploymentPos, SoftFork>;
}

export type HardForks = HardforkFeature[];

export interface HardforkFeature {
  rfc: string;
  epochNumber: EpochNumber | null;
}

export type SoftForkStatus = "buried" | "rfc0043";

export type SoftFork = Buried | Rfc0043;

export type Buried = {
  status: SoftForkStatus;
  active: boolean;
  epoch: EpochNumber;
};

export type Rfc0043 = {
  status: SoftForkStatus;
  rfc0043: Deployment;
};

export type Ratio = {
  numer: Uint64;
  denom: Uint64;
};

export type Deployment = {
  bit: number;
  start: EpochNumber;
  timeout: EpochNumber;
  minActivationEpoch: EpochNumber;
  period: EpochNumber;
  threshold: Ratio;
};

export interface DryRunResult {
  cycles: HexNumber;
}

export interface NodeAddress {
  address: string;
  score: HexNumber;
}

export interface LocalNodeProtocol {
  id: HexNumber;
  name: string;
  supportVersions: string[];
}

export interface LocalNode {
  version: string;
  nodeId: string;
  active: boolean;
  addresses: NodeAddress[];
  protocols: LocalNodeProtocol[];
  connections: HexNumber;
}

export interface PeerSyncState {
  bestKnownHeaderHash?: HexString;
  bestKnownHeaderNumber?: HexNumber;
  lastCommonHeaderHash?: HexString;
  lastCommonHeaderNumber?: HexNumber;
  unknownHeaderListSize?: HexNumber;
  canFetchCount?: HexNumber;
  inflightCount?: HexNumber;
}

export interface RemoteNodeProtocol {
  id: HexNumber;
  version: string;
}

export interface RemoteNode {
  version: string;
  nodeId: string;
  addresses: NodeAddress[];
  isOutbound: boolean;
  connectedDuration: HexNumber;
  lastPingDuration?: HexNumber;
  syncState?: PeerSyncState;
  protocols: RemoteNodeProtocol[];
}

export interface BannedAddr {
  address: string;
  banUntil: HexNumber;
  banReason: string;
  createdAt: HexNumber;
}

export interface SyncState {
  ibd: boolean;
  bestKnownBlockNumber: HexNumber;
  bestKnownBlockTimestamp: HexNumber;
  orphanBlocksCount: HexNumber;
  inflightBlocksCount: HexNumber;
  fastTime: HexNumber;
  normalTime: HexNumber;
  lowTime: HexNumber;
}

export interface TxPoolInfo {
  tipHash: Hash;
  tipNumber: HexNumber;
  pending: HexNumber;
  proposed: HexNumber;
  orphan: HexNumber;
  totalTxSize: HexNumber;
  totalTxCycles: HexNumber;
  minFeeRate: HexNumber;
  lastTxsUpdatedAt: HexNumber;
}

export interface TxPoolIds {
  pending: Hash[];
  proposed: Hash[];
}

export interface TxVerbosity {
  cycles: HexNumber;
  size: HexNumber;
  fee: HexNumber;
  ancestorsSize: HexNumber;
  ancestorsCycles: HexNumber;
  ancestorsCount: HexNumber;
}

export interface TxPoolVerbosity {
  pending: {
    [key: string]: TxVerbosity;
  };
  proposed: {
    [key: string]: TxVerbosity;
  };
}

export type RawTxPool = TxPoolIds | TxPoolVerbosity;

/** https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/alert.rs **/

export interface AlertMessage {
  id: HexNumber;
  priority: HexNumber;
  noticeUntil: HexNumber;
  message: string;
}

export interface Alert {
  id: HexNumber;
  cancel: HexNumber;
  minVersion?: string;
  maxVersion?: string;
  priority: HexNumber;
  noticeUntil: HexNumber;
  message: string;
  signatures: HexString[];
}

/** https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/info.rs **/

export type DeploymentPos = "testdummy" | "lightClient";
export type DeploymentState =
  | "defined"
  | "started"
  | "lockedIn"
  | "active"
  | "failed";
export type DeploymentsInfo = {
  hash: Hash;
  epoch: EpochNumber;
  deployments: MapLike<DeploymentPos, DeploymentInfo>;
};
export type DeploymentInfo = {
  //  determines which bit in the version field of the block is to be used to signal the softfork lock-in and activation. It is chosen from the set {0,1,2,…,28}.
  bit: number;
  start: EpochNumber;
  timeout: EpochNumber;
  minActivationEpoch: EpochNumber;
  period: EpochNumber;
  threshold: Ratio;
  since: EpochNumber;
  state: DeploymentState;
};

export interface ChainInfo {
  chain: string;
  medianTime: HexNumber;
  epoch: EpochNumberWithFraction;
  difficulty: HexNumber;
  isInitialBlockDownload: boolean;
  alerts: AlertMessage[];
}

type Uint64 = Hexadecimal;
type EpochNumber = Hexadecimal;
type EpochNumberWithFraction = Uint64;

// this is a type to mapping the `HashMap`, `BTreeMap` in `jsonrpc-types`
// there are some returns of CKB RPC are in this format, like `Softfork`
type MapLike<K extends string, V> = {
  [key in K]?: V;
};
