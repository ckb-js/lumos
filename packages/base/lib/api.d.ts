import { Hash, HexNumber, HexString, PackedSince } from "./primitive";

export interface Header {
  timestamp: HexNumber;
  number: HexNumber;
  epoch: HexNumber;
  compact_target: HexNumber;
  dao: Hash;
  hash: Hash;
  nonce: HexNumber;
  parent_hash: Hash;
  proposals_hash: Hash;
  transactions_root: Hash;
  uncles_hash: Hash;
  version: HexNumber;
}

export type HashType = "type" | "data" | "data1";
export interface Script {
  code_hash: Hash;
  hash_type: HashType;
  args: HexString;
}

export interface OutPoint {
  tx_hash: Hash;
  index: HexNumber;
}

export type DepType = "dep_group" | "code";
export interface CellDep {
  out_point: OutPoint;
  dep_type: DepType;
}

export interface Input {
  previous_output: OutPoint;
  since: PackedSince;
}

export interface Output {
  capacity: HexString;
  lock: Script;
  type?: Script;
}

export interface WitnessArgs {
  lock?: HexString;
  input_type?: HexString;
  output_type?: HexString;
}
export interface RawTransaction {
  cell_deps: CellDep[];
  hash?: Hash;
  header_deps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputs_data: HexString[];
  version: HexString;
}
export interface Transaction {
  cell_deps: CellDep[];
  hash?: Hash;
  header_deps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputs_data: HexString[];
  version: HexNumber;
  witnesses: HexString[];
}

export interface TxStatus {
  block_hash?: Hash;
  status: string;
}

export interface TransactionWithStatus {
  transaction: Transaction;
  tx_status: TxStatus;
}

export interface Cell {
  cell_output: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
  data: HexString;
  out_point?: OutPoint;
  block_hash?: Hash;
  block_number?: HexNumber;
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

export interface CellWithStatus {
  cell: {
    data: {
      content: HexString;
      hash: Hash;
    };
    output: Output;
  } | null;
  status: "live" | "unknown";
}

export interface Epoch {
  compact_target: HexNumber;
  length: HexNumber;
  start_number: HexNumber;
  number: HexNumber;
}

export interface BlockEconomicState {
  issuance: {
    primary: HexNumber;
    secondary: HexNumber;
  };
  miner_reward: {
    primary: HexNumber;
    secondary: HexNumber;
    committed: HexNumber;
    proposal: HexNumber;
  };
  txs_fee: HexNumber;
  finalized_at: Hash;
}

export interface MerkleProof {
  indices: HexNumber[];
  lemmas: Hash[];
}

export interface TransactionProof {
  block_hash: Hash;
  witnesses_root: Hash;
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
  genesis_hash: Hash;
  dao_type_hash?: Hash;
  secp256k1_blake160_sighash_all_type_hash?: Hash;
  secp256k1_blake160_multisig_all_type_hash?: Hash;
  initial_primary_epoch_reward: HexNumber;
  secondary_epoch_reward: HexNumber;
  max_uncles_num: HexNumber;
  orphan_rate_target: Rational;
  epoch_duration_target: HexNumber;
  tx_proposal_window: ProposalWindow;
  proposer_reward_ratio: Rational;
  cellbase_maturity: HexNumber;
  median_time_block_count: HexNumber;
  max_block_cycles: HexNumber;
  max_block_bytes: HexNumber;
  block_version: HexNumber;
  tx_version: HexNumber;
  type_id_code_hash: Hash;
  max_block_proposals_limit: HexNumber;
  primary_epoch_reward_halving_interval: HexNumber;
  permanent_difficulty_in_dummy: boolean;
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
  support_versions: string[];
}

export interface LocalNode {
  version: string;
  node_id: string;
  active: boolean;
  addresses: NodeAddress[];
  protocols: LocalNodeProtocol[];
  connections: HexNumber;
}

export interface PeerSyncState {
  best_known_header_hash?: HexString;
  best_known_header_number?: HexNumber;
  last_common_header_hash?: HexString;
  last_common_header_number?: HexNumber;
  unknown_header_list_size?: HexNumber;
}

export interface RemoteNodeProtocol {
  id: HexNumber;
  version: string;
}

export interface RemoteNode {
  version: string;
  node_id: string;
  addresses: NodeAddress[];
  is_outbount: boolean;
  connected_duration: HexNumber;
  last_ping_duration?: HexNumber;
  sync_state?: PeerSyncState;
  protocols: RemoteNodeProtocol[];
}

export interface BannedAddr {
  address: string;
  ban_until: HexNumber;
  ban_reason: string;
  created_at: HexNumber;
}

export interface SyncState {
  ibd: boolean;
  best_known_block_number: HexNumber;
  best_known_block_timestamp: HexNumber;
  orphan_blocks_count: HexNumber;
  inflight_blocks_count: HexNumber;
  fast_time: HexNumber;
  normal_time: HexNumber;
  low_time: HexNumber;
}

export interface TxPoolInfo {
  tip_hash: Hash;
  tip_number: HexNumber;
  pending: HexNumber;
  proposed: HexNumber;
  orphan: HexNumber;
  total_tx_size: HexNumber;
  total_tx_cycles: HexNumber;
  min_fee_rate: HexNumber;
  last_txs_updated_at: HexNumber;
}

export interface TxPoolIds {
  pending: Hash[];
  proposed: Hash[];
}

export interface TxVerbosity {
  cycles: HexNumber;
  size: HexNumber;
  fee: HexNumber;
  ancestors_size: HexNumber;
  ancestors_cycles: HexNumber;
  ancestors_count: HexNumber;
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
  notice_until: HexNumber;
  message: string;
}

export interface ChainInfo {
  chain: string;
  median_time: HexNumber;
  epoch: HexNumber;
  difficulty: HexNumber;
  is_initial_block_download: boolean;
  alerts: AlertMessage[];
}

export interface Alert {
  id: HexNumber;
  cancel: HexNumber;
  min_version?: string;
  max_version?: string;
  priority: HexNumber;
  notice_until: HexNumber;
  message: string;
  signatures: HexString[];
}
