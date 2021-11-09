import * as core from "./lib/core";
export { core };

import { Reader } from "ckb-js-toolkit";

/**
 * HexString represents string starts with "0x" and followed by even number(including empty) of [0-9a-fA-F] characters.
 */
export type HexString = string;
/**
 * Hexadecimal represents string starts with "0x" and followed by any number(excluding empty) of [0-9a-fA-F] characters.
 */
export type Hexadecimal = string;
export type Hash = HexString;
export type HexNumber = Hexadecimal;
export type PackedSince = string;
export type PackedDao = string;

export type Address = string;

export type HexadecimalRange = [Hexadecimal, Hexadecimal];

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
  extra_hash: Hash;
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

/**
 * argsLen: if argsLen = 20, it means collected cells cell.cell_output.lock.args should be 20-byte length, and prefix match to lock.args.
 * And if argsLen = -1 (default), means cell.cell_output.lock.args should equals to lock.args.
 */
export interface QueryOptions {
  lock?: Script | ScriptWrapper;
  type?: Script | ScriptWrapper | "empty";
  // data = any means any data content is ok
  data?: string | "any";
  argsLen?: number | "any";
  /** `fromBlock` itself is included in range query. */
  fromBlock?: Hexadecimal;
  /** `toBlock` itself is included in range query. */
  toBlock?: Hexadecimal;
  skip?: number;
  order?: "asc" | "desc";
}

export interface ScriptWrapper {
  script: Script;
  ioType?: "input" | "output" | "both";
  argsLen?: number | "any";
}

export interface CellCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Cell>;
}

export interface CellCollector {
  collect(): CellCollectorResults;
}

export interface CellProvider {
  uri?: string;
  collector(queryOptions: QueryOptions): CellCollector;
}

declare class CKBHasher {
  update(data: string | Reader | ArrayBuffer): this;

  digestReader(): Reader;

  digestHex(): Hash;
}

export declare const utils: {
  CKBHasher: typeof CKBHasher;

  ckbHash(buffer: ArrayBuffer): Reader;

  /**
   * convert bigint to BigUInt64 little-endian hex string
   *
   * @param num
   */
  toBigUInt64LE(num: bigint): HexString;

  /**
   * convert BigUInt64 little-endian hex string to bigint
   *
   * @param hex BigUInt64 little-endian hex string
   */
  readBigUInt64LE(hex: HexString): bigint;

  /**
   * convert bigint to BigUInt128 little-endian hex string
   *
   * @param u128
   */
  toBigUInt128LE(u128: bigint): string;

  /**
   * convert BigUInt64 little-endian hex string to bigint
   *
   * @param leHex BigUInt128 little-endian hex string
   */
  readBigUInt128LE(leHex: HexString): bigint;

  /**
   * compute lock/type hash
   *
   * @param script
   * @param options
   */
  computeScriptHash(script: Script, options?: { validate?: boolean }): Hash;

  hashCode(buffer: Buffer): number;

  assertHexString(debugPath: string, str: string): void;

  assertHexadecimal(debugPath: string, str: string): void;

  generateTypeIdScript(input: Input, outputIndex: HexNumber): Script;
};

export declare const helpers: {
  /**
   * Check a cell is match QueryOptions or not, not support `skip` and `order`
   *
   * @param cell
   * @param queryOptions
   */
  isCellMatchQueryOptions(cell: Cell, queryOptions: QueryOptions): boolean;
};

export interface EpochSinceValue {
  length: number;
  index: number;
  number: number;
}

export type SinceType = "epochNumber" | "blockNumber" | "blockTimestamp";

export interface SinceValidationInfo {
  block_number: HexNumber;
  epoch: HexNumber;
  median_timestamp: HexNumber;
}

export declare const since: {
  /**
   * Parse since and get relative or not, type, and value of since
   *
   * @param since
   */
  parseSince(
    since: PackedSince
  ):
    | {
        relative: boolean;
        type: "epochNumber";
        value: EpochSinceValue;
      }
    | {
        relative: boolean;
        type: "blockNumber" | "blockTimestamp";
        value: bigint;
      };

  /**
   * parse epoch from blockHeader.epoch
   *
   * @param epoch
   */
  parseEpoch(epoch: HexString): EpochSinceValue;

  /**
   * return maximum since of args
   *
   * @param args sinces in absolute-epoch-number format
   */
  maximumAbsoluteEpochSince(...args: PackedSince[]): PackedSince;

  /**
   * generate absolute-epoch-number format since
   *
   * @param params
   */
  generateAbsoluteEpochSince(params: EpochSinceValue): PackedSince;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   */
  parseAbsoluteEpochSince(since: PackedSince): EpochSinceValue;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   * @param tipHeaderEpoch
   */
  validateAbsoluteEpochSince(
    since: PackedSince,
    tipHeaderEpoch: HexString
  ): boolean;

  /**
   * Compare since with tipHeader, check since is valid or not.
   *
   * @param since
   * @param tipHeader
   * @param sinceHeader can left empty if absolute since
   */
  validateSince(
    since: PackedSince,
    tipSinceValidationInfo: SinceValidationInfo,
    cellSinceValidationInfo?: SinceValidationInfo
  ): boolean;

  /**
   *
   * @param params
   */
  generateSince(
    params:
      | {
          relative: boolean;
          type: SinceType;
          value: bigint;
        }
      | {
          relative: boolean;
          type: "epochNumber";
          value: EpochSinceValue;
        }
  ): PackedSince;

  /**
   * generate header epoch from epoch since value
   *
   * @param params
   */
  generateHeaderEpoch(params: EpochSinceValue): HexString;
};

export declare const denormalizers: {
  DenormalizeOutPoint(outPoint: core.OutPoint): OutPoint;

  DenormalizeScript(script: core.Script): Script;
};

declare class Value {
  equals(other: Value): boolean;

  hashCode(): number;

  hash(): Hash;
}

declare class ScriptValue extends Value {
  constructor(script: Script, options: { validate?: boolean });
}

declare class OutPointValue extends Value {
  constructor(outPoint: OutPoint, options: { validate?: boolean });
}
declare class RawTransactionValue extends Value {
  constructor(rawTransaction: RawTransaction, options?: { validate?: boolean });
}

declare class TransactionValue extends Value {
  constructor(transaction: Transaction, options?: { validate?: boolean });
}

export declare const values: {
  ScriptValue: typeof ScriptValue;
  OutPointValue: typeof OutPointValue;
  TransactionValue: typeof TransactionValue;
  RawTransactionValue: typeof RawTransactionValue;
};

export type LogLevel = "warn" | "error" | string;
// Indexer
export type Logger = (level: LogLevel, message: string) => void;
export type Log = (message: string) => void;

export interface IndexerOptions {
  pollIntervalSeconds?: number;
  livenessCheckIntervalSeconds?: number;
  logger?: Logger;
  keepNum?: number;
  pruneInterval?: number;
  rpcOptions?: object;
}

export interface Tip {
  block_number: string;
  block_hash: string;
}

export declare class Indexer {
  uri: string;

  running(): boolean;
  startForever(): void;
  start(): void;
  stop(): void;
  tip(): Promise<Tip>;

  collector(queries: QueryOptions): CellCollector;
  subscribe(queries: QueryOptions): NodeJS.EventEmitter;
  subscribeMedianTime(): NodeJS.EventEmitter;
  waitForSync(blockDifference?: number): Promise<void>;
}

// CellCollector
export declare interface BaseCellCollector extends CellCollector {
  count(): Promise<number>;

  collect(): CellCollectorResults;
}

// TransactionCollector
export interface TransactionCollectorOptions {
  skipMissing?: boolean;
  includeStatus?: boolean;
}

export interface TransactionCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Transaction | TransactionWithStatus>;
}

export declare class TransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );

  count(): Promise<number>;

  getTransactionHashes(): Promise<HexString[]>;

  collect(): TransactionCollectorResults;
}

export declare const indexer: {
  TransactionCollector: typeof TransactionCollector;
};

export declare const logger: {
  defaultLogger: Logger;
  deprecated: Log;
};
