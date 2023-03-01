/**
 * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs
 */
import { CKBComponents } from "./api";

/* eslint-disable  @typescript-eslint/no-namespace */
export namespace RPC {
  export type ProposalShortId = CKBComponents.ProposalShortId;
  export type Number = CKBComponents.Number;
  export type UInt32 = CKBComponents.UInt32;
  export type Count = CKBComponents.Count;
  export type DAO = CKBComponents.DAO;
  export type Hash = CKBComponents.Hash;
  export type Hash256 = CKBComponents.Hash256;
  export type Version = CKBComponents.Version;
  export type Capacity = CKBComponents.Capacity;
  export type Witness = CKBComponents.Witness;
  export type Bytes = CKBComponents.Bytes;
  export type Index = CKBComponents.Index;
  export type Since = CKBComponents.Since;
  export type Timestamp = CKBComponents.Timestamp;
  export type BlockNumber = CKBComponents.BlockNumber;
  export type EpochInHeader = string;
  export type Difficulty = CKBComponents.Difficulty;
  export type Cycles = CKBComponents.Cycles;
  export type Size = CKBComponents.Size;
  export type RationalU256 = CKBComponents.RationalU256;
  export type ProposalWindow = CKBComponents.ProposalWindow;
  export type EpochNumberWithFraction = CKBComponents.EpochNumberWithFraction;
  export type JsonBytes = CKBComponents.JsonBytes;
  export type IOType = CKBComponents.IOType;

  export enum TransactionStatus {
    Pending = "pending",
    Proposed = "proposed",
    Committed = "committed",
  }

  export type ScriptHashType = CKBComponents.ScriptHashType;

  export type DepType = "code" | "dep_group";

  export interface Script {
    args: Bytes;
    code_hash: Hash256;
    hash_type: ScriptHashType;
  }

  export interface OutPoint {
    tx_hash: Hash256;
    index: Index;
  }

  export interface CellInput {
    previous_output: OutPoint;
    since: Since;
  }

  export interface CellOutput {
    capacity: Capacity;
    lock: Script;
    type?: Script | undefined;
  }

  export type Cell = CellOutput;

  export interface LiveCell {
    data: {
      content: Hash;
      hash: Hash256;
    };
    output: CellOutput;
  }

  export interface CellDep {
    out_point: OutPoint;
    dep_type: DepType;
  }

  export interface CellIncludingOutPoint {
    block_hash: Hash256;
    capacity: Capacity;
    lock: Script;
    out_point: OutPoint;
    cellbase: boolean;
    output_data_len: string;
  }

  export interface RawTransaction {
    version: Version;
    cell_deps: CellDep[];
    header_deps: Hash256[];
    inputs: CellInput[];
    outputs: CellOutput[];
    witnesses: Witness[];
    outputs_data: Bytes[];
  }

  export interface Transaction extends RawTransaction {
    hash: Hash256;
  }

  export interface TransactionWithStatus {
    transaction: Transaction;
    tx_status:
      | {
          block_hash: Hash256;
          status: TransactionStatus.Committed;
        }
      | {
          block_hash: undefined;
          status: TransactionStatus.Pending | TransactionStatus.Proposed;
        };
  }

  export interface TransactionPoint {
    block_number: BlockNumber;
    index: Index;
    tx_hash: Hash256;
  }

  export interface TransactionByLockHash {
    consumed_by: undefined | TransactionPoint;
    created_by: TransactionPoint;
  }
  export type TransactionsByLockHash = TransactionByLockHash[];

  export interface LiveCellByLockHash {
    cell_output: CellOutput;
    created_by: TransactionPoint;
    cellbase: boolean;
    output_data_len: string;
  }
  export type LiveCellsByLockHash = LiveCellByLockHash[];

  export interface Header {
    compact_target: Hash;
    dao: DAO;
    epoch: EpochInHeader;
    hash: Hash256;
    number: BlockNumber;
    parent_hash: Hash256;
    proposals_hash: Hash256;
    nonce: CKBComponents.Nonce;
    timestamp: Timestamp;
    transactions_root: Hash256;
    extra_hash: Hash256;
    version: Version;
  }

  export interface UncleBlock {
    header: Header;
    proposals: ProposalShortId[];
  }

  export interface Block {
    header: Header;
    uncles: UncleBlock[];
    transactions: Transaction[];
    proposals: ProposalShortId[];
    extension?: JsonBytes | undefined;
  }

  export interface AlertMessage {
    id: string;
    priority: string;
    notice_until: Timestamp;
    message: string;
  }

  export interface BlockchainInfo {
    is_initial_block_download: boolean;
    epoch: string;
    difficulty: string;
    median_time: string;
    chain: string;
    alerts: AlertMessage[];
  }

  export interface LocalNodeInfo {
    active: boolean;
    addresses: Record<"address" | "score", string>[];
    connections: string;
    node_id: string;
    protocols: { id: string; name: string; support_versions: string[] }[];
    version: string;
  }

  export interface RemoteNodeInfo {
    addresses: Record<"address" | "score", string>[];
    connected_duration: string;
    is_outbound: boolean;
    last_ping_duration: string;
    node_id: string;
    protocols: Record<"id" | "version", string>[];
    sync_state: Record<
      | "best_known_header_hash"
      | "best_known_header_number"
      | "can_fetch_count"
      | "inflight_count"
      | "last_common_header_hash"
      | "last_common_header_number"
      | "unknown_header_list_size",
      string | undefined
    >;
    version: string;
  }

  export interface PeersState {
    last_updated: string;
    blocks_in_flight: string;
    peer: string;
  }

  export interface TxPoolInfo {
    last_txs_updated_at: Timestamp;
    min_fee_rate: string;
    orphan: Count;
    pending: Count;
    proposed: Count;
    tip_hash: Hash256;
    tip_number: BlockNumber;
    total_tx_cycles: Cycles;
    total_tx_size: Size;
  }

  export interface Epoch {
    compact_target: Hash;
    length: string;
    number: string;
    start_number: string;
  }

  export interface LockHashIndexState {
    block_hash: Hash256;
    block_number: BlockNumber;
    lock_hash: Hash256;
  }

  export type LockHashIndexStates = LockHashIndexState[];

  export interface BannedAddress {
    address: string;
    ban_reason: string;
    ban_until: Timestamp;
    created_at: Timestamp;
  }
  export type BannedAddresses = BannedAddress[];

  export interface CellbaseOutputCapacityDetails {
    primary: string;
    proposal_reward: string;
    secondary: string;
    total: string;
    tx_fee: string;
  }

  export interface FeeRate {
    fee_rate: string;
  }

  export interface CapacityByLockHash {
    block_number: BlockNumber;
    capacity: Capacity;
    cells_count: string;
  }

  export interface BlockEconomicState {
    finalized_at: string;
    issuance: {
      primary: string;
      secondary: string;
    };
    miner_reward: {
      committed: string;
      primary: string;
      proposal: string;
      secondary: string;
    };
    txs_fee: string;
  }

  export interface SyncState {
    best_known_block_number: string;
    best_known_block_timestamp: string;
    fast_time: string;
    ibd: boolean;
    inflight_blocks_count: string;
    low_time: string;
    normal_time: string;
    orphan_blocks_count: string;
  }

  export interface TransactionProof {
    block_hash: Hash;
    proof: {
      indices: string[];
      lemmas: Hash[];
    };
    witnesses_root: Hash;
  }

  export type TxPoolIds = Record<"pending" | "proposed", Array<Hash256>>;

  export interface TxVerbosity {
    cycles: Cycles;
    size: Size;
    fee: Capacity;
    ancestors_size: Size;
    ancestors_cycles: Cycles;
    ancestors_count: Count;
  }

  export type TxPoolVerbosity = Record<
    "pending" | "proposed",
    Record<Hash256, TxVerbosity>
  >;

  export type RawTxPool = TxPoolIds | TxPoolVerbosity;

  export interface Consensus {
    id: string;
    genesis_hash: Hash256;
    hardfork_features: Array<{ rfc: string; epoch_number: string | undefined }>;
    dao_type_hash: Hash256 | undefined;
    secp256k1_blake160_sighash_all_type_hash: Hash256 | undefined;
    secp256k1_blake160_multisig_all_type_hash: Hash256 | undefined;
    initial_primary_epoch_reward: Capacity;
    secondary_epoch_reward: Capacity;
    max_uncles_num: string;
    orphan_rate_target: RationalU256;
    epoch_duration_target: string;
    tx_proposal_window: ProposalWindow;
    proposer_reward_ratio: RationalU256;
    cellbase_maturity: EpochNumberWithFraction;
    median_time_block_count: Count;
    max_block_cycles: Cycles;
    max_block_bytes: string;
    block_version: Version;
    tx_version: Version;
    type_id_code_hash: Hash256;
    max_block_proposals_limit: string;
    primary_epoch_reward_halving_interval: string;
    permanent_difficulty_in_dummy: boolean;
  }

  export interface Tip {
    block_hash: Hash256;
    block_number: BlockNumber;
  }

  export interface IndexerCell {
    block_number: BlockNumber;
    out_point: OutPoint;
    output: CellOutput;
    output_data: string;
    tx_index: string;
  }

  export type IndexerTransaction<Goruped extends boolean = false> =
    Goruped extends true
      ? GroupedIndexerTransaction
      : UngroupedIndexerTransaction;
  export interface UngroupedIndexerTransaction {
    tx_hash: Hash256;
    block_number: BlockNumber;
    io_index: string;
    io_type: IOType;
    tx_index: string;
  }

  export interface GroupedIndexerTransaction {
    tx_hash: Hash256;
    block_number: BlockNumber;
    tx_index: string;
    cells: Array<[IOType, string]>;
  }

  export interface GetTransactionsResult<Goruped extends boolean = false> {
    last_cursor: Hash256;
    objects: IndexerTransaction<Goruped>[];
  }

  export interface GetLiveCellsResult {
    last_cursor: Hash256;
    objects: IndexerCell[];
  }

  export interface CellsCapacity {
    capacity: Capacity;
    block_hash: Hash256;
    block_number: BlockNumber;
  }

  export type HexadecimalRange = [string, string];
  export type ScriptType = "type" | "lock";
  export type ScriptSearchMode = "prefix" | "exact";

  export interface SearchFilter {
    script?: Script;
    output_data_len_range?: HexadecimalRange; //empty
    output_capacity_range?: HexadecimalRange; //empty
    block_range?: HexadecimalRange; //fromBlock-toBlock
    script_len_range?: HexadecimalRange;
  }
  export interface SearchKey {
    script: Script;
    script_type: ScriptType;
    filter?: SearchFilter;
    script_search_mode?: ScriptSearchMode;
  }
  export interface GetCellsSearchKey extends SearchKey {
    with_data?: boolean;
  }

  export interface GetTransactionsSearchKey extends SearchKey {
    group_by_transaction?: boolean;
  }
}
/* eslint-enable camelcase */
