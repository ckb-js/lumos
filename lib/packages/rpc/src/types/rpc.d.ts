/**
 * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs
 */
import { CKBComponents } from './api';
export declare namespace RPC {
    type ProposalShortId = CKBComponents.ProposalShortId;
    type Number = CKBComponents.Number;
    type UInt32 = CKBComponents.UInt32;
    type Count = CKBComponents.Count;
    type DAO = CKBComponents.DAO;
    type Hash = CKBComponents.Hash;
    type Hash256 = CKBComponents.Hash256;
    type Version = CKBComponents.Version;
    type Capacity = CKBComponents.Capacity;
    type Witness = CKBComponents.Witness;
    type Bytes = CKBComponents.Bytes;
    type Index = CKBComponents.Index;
    type Since = CKBComponents.Since;
    type Timestamp = CKBComponents.Timestamp;
    type BlockNumber = CKBComponents.BlockNumber;
    type EpochInHeader = string;
    type Difficulty = CKBComponents.Difficulty;
    type Cycles = CKBComponents.Cycles;
    type Size = CKBComponents.Size;
    type RationalU256 = CKBComponents.RationalU256;
    type ProposalWindow = CKBComponents.ProposalWindow;
    type EpochNumberWithFraction = CKBComponents.EpochNumberWithFraction;
    type JsonBytes = CKBComponents.JsonBytes;
    enum TransactionStatus {
        Pending = "pending",
        Proposed = "proposed",
        Committed = "committed"
    }
    type ScriptHashType = CKBComponents.ScriptHashType;
    type DepType = 'code' | 'dep_group';
    interface Script {
        args: Bytes;
        code_hash: Hash256;
        hash_type: ScriptHashType;
    }
    interface OutPoint {
        tx_hash: Hash256;
        index: Index;
    }
    interface CellInput {
        previous_output: OutPoint | undefined;
        since: Since;
    }
    interface CellOutput {
        capacity: Capacity;
        lock: Script;
        type?: Script | undefined;
    }
    type Cell = CellOutput;
    interface LiveCell {
        data?: {
            content: Hash;
            hash: Hash256;
        };
        output: CellOutput;
    }
    interface CellDep {
        out_point: OutPoint | undefined;
        dep_type: DepType;
    }
    interface CellIncludingOutPoint {
        block_hash: Hash256;
        capacity: Capacity;
        lock: Script;
        out_point: OutPoint | undefined;
        cellbase: boolean;
        output_data_len: string;
    }
    interface RawTransaction {
        version: Version;
        cell_deps: CellDep[];
        header_deps: Hash256[];
        inputs: CellInput[];
        outputs: CellOutput[];
        witnesses: Witness[];
        outputs_data: Bytes[];
    }
    interface Transaction extends RawTransaction {
        hash: Hash256;
    }
    interface TransactionWithStatus {
        transaction: Transaction;
        tx_status: {
            block_hash: Hash256;
            status: TransactionStatus.Committed;
        } | {
            block_hash: undefined;
            status: TransactionStatus.Pending | TransactionStatus.Proposed;
        };
    }
    interface TransactionPoint {
        block_number: BlockNumber;
        index: Index;
        tx_hash: Hash256;
    }
    interface TransactionByLockHash {
        consumed_by: undefined | TransactionPoint;
        created_by: TransactionPoint;
    }
    type TransactionsByLockHash = TransactionByLockHash[];
    interface LiveCellByLockHash {
        cell_output: CellOutput;
        created_by: TransactionPoint;
        cellbase: boolean;
        output_data_len: string;
    }
    type LiveCellsByLockHash = LiveCellByLockHash[];
    interface Header {
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
    interface UncleBlock {
        header: Header;
        proposals: ProposalShortId[];
    }
    interface Block {
        header: Header;
        uncles: UncleBlock[];
        transactions: Transaction[];
        proposals: ProposalShortId[];
        extension?: JsonBytes | undefined;
    }
    interface AlertMessage {
        id: string;
        priority: string;
        notice_until: Timestamp;
        message: string;
    }
    interface BlockchainInfo {
        is_initial_block_download: boolean;
        epoch: string;
        difficulty: string;
        median_time: string;
        chain: string;
        alerts: AlertMessage[];
    }
    interface LocalNodeInfo {
        active: boolean;
        addresses: Record<'address' | 'score', string>[];
        connections: string;
        node_id: string;
        protocols: {
            id: string;
            name: string;
            support_versions: string[];
        }[];
        version: string;
    }
    interface RemoteNodeInfo {
        addresses: Record<'address' | 'score', string>[];
        connected_duration: string;
        is_outbound: boolean;
        last_ping_duration: string;
        node_id: string;
        protocols: Record<'id' | 'version', string>[];
        sync_state: Record<'best_known_header_hash' | 'best_known_header_number' | 'can_fetch_count' | 'inflight_count' | 'last_common_header_hash' | 'last_common_header_number' | 'unknown_header_list_size', string | undefined>;
        version: string;
    }
    interface PeersState {
        last_updated: string;
        blocks_in_flight: string;
        peer: string;
    }
    interface TxPoolInfo {
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
    interface Epoch {
        compact_target: Hash;
        length: string;
        number: string;
        start_number: string;
    }
    interface LockHashIndexState {
        block_hash: Hash256;
        block_number: BlockNumber;
        lock_hash: Hash256;
    }
    type LockHashIndexStates = LockHashIndexState[];
    interface BannedAddress {
        address: string;
        ban_reason: string;
        ban_until: Timestamp;
        created_at: Timestamp;
    }
    type BannedAddresses = BannedAddress[];
    interface CellbaseOutputCapacityDetails {
        primary: string;
        proposal_reward: string;
        secondary: string;
        total: string;
        tx_fee: string;
    }
    interface FeeRate {
        fee_rate: string;
    }
    interface CapacityByLockHash {
        block_number: BlockNumber;
        capacity: Capacity;
        cells_count: string;
    }
    interface BlockEconomicState {
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
    interface SyncState {
        best_known_block_number: string;
        best_known_block_timestamp: string;
        fast_time: string;
        ibd: boolean;
        inflight_blocks_count: string;
        low_time: string;
        normal_time: string;
        orphan_blocks_count: string;
    }
    interface TransactionProof {
        block_hash: Hash;
        proof: {
            indices: Number[];
            lemmas: Hash[];
        };
        witnesses_root: Hash;
    }
    type TxPoolIds = Record<'pending' | 'proposed', Array<Hash256>>;
    interface TxVerbosity {
        cycles: Cycles;
        size: Size;
        fee: Capacity;
        ancestors_size: Size;
        ancestors_cycles: Cycles;
        ancestors_count: Count;
    }
    type TxPoolVerbosity = Record<'pending' | 'proposed', Record<Hash256, TxVerbosity>>;
    type RawTxPool = TxPoolIds | TxPoolVerbosity;
    interface Consensus {
        id: string;
        genesis_hash: Hash256;
        hardfork_features: Array<{
            rfc: string;
            epoch_number: string | undefined;
        }>;
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
}
