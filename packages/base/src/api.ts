import { Hash, HexNumber, HexString, PackedSince } from "./primitive";
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

export type HashType = "type" | "data" | "data1";
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

export interface TransactionWithStatus {
  transaction: Transaction;
  txStatus: TxStatus;
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
  // added this field by: https://github.com/nervosnetwork/ckb/pull/2879
  hardforkFeatures: Array<{ rfc: string; epochNumber: string | undefined }>;
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
}

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

export interface AlertMessage {
  id: HexNumber;
  priority: HexNumber;
  noticeUntil: HexNumber;
  message: string;
}

export interface ChainInfo {
  chain: string;
  medianTime: HexNumber;
  epoch: HexNumber;
  difficulty: HexNumber;
  isInitialBlockDownload: boolean;
  alerts: AlertMessage[];
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
