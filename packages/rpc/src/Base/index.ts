import chainRpc from "./chain";
import experimentalRpc from "./experimental";
import netRpc from "./net";
import poolRpc from "./pool";
import statsRpc from "./stats";
import indexerRpc from "./indexer";
import { CKBComponents } from "../types/api";

export interface RpcPropertes {
  [name: string]: Omit<CKBComponents.Method, "name">;
}

export const rpcProperties: RpcPropertes = {
  ...chainRpc,
  ...experimentalRpc,
  ...indexerRpc,
  // skip minerRpc
  ...netRpc,
  ...poolRpc,
  ...statsRpc,
  // skip subscription
};

/**
 * - `0x0`: without verbosity, returns the raw serialized block bytes
 * - `0x2`: with verbosity, returns the serialized block JSON object
 * - `null`: default value, the same with `0x2`
 */
export type GetBlockVerbosityOptions = "0x0" | "0x2" | null;
export type GetBlockWithCycleOptions = boolean | null;
export type VerbosityBlock<Verbosity extends GetBlockVerbosityOptions> =
  Verbosity extends "0x0" ? string : CKBComponents.BlockView;
export type BlockResponse<
  Verbosity extends GetBlockVerbosityOptions,
  WithCycle extends GetBlockWithCycleOptions
> = WithCycle extends true
  ? { block: VerbosityBlock<Verbosity>; cycles: CKBComponents.UInt64 }
  : VerbosityBlock<Verbosity>;

// prettier-ignore
export interface GetTransaction {
  (hash: CKBComponents.Hash): Promise<CKBComponents.TransactionWithStatus>;
  (hash: CKBComponents.Hash, verbosity: "0x0", onlyCommitted?: boolean): Promise<CKBComponents.TransactionWithStatus<string>>;
  (hash: CKBComponents.Hash, verbosity: "0x1", onlyCommitted?: boolean): Promise<CKBComponents.TransactionWithStatus<null>>;
  (hash: CKBComponents.Hash, verbosity: "0x2", onlyCommitted?: boolean): Promise<CKBComponents.TransactionWithStatus>;
}

// prettier-ignore
export interface GetHeader<Q> {
  (query: Q, verbosity?: "0x1"): Promise<CKBComponents.BlockHeader>;
  (query: Q, verbosity: "0x0"): Promise<string>;
}

export interface Base {
  /* Chain */

  /**
   * @method getTipBlockNumber
   * @memberof DefaultRPC
   * @description rpc to get the number of blocks in the longest blockchain
   * @return {Promise<string>} block number
   */
  getTipBlockNumber: () => Promise<CKBComponents.BlockNumber>;

  /**
   * @method getTipHeader
   * @memberof DefaultRPC
   * @description rpc to get the tip header of the longeest blockchain
   * @return {Promise<object>} block header
   */
  getTipHeader: () => Promise<CKBComponents.BlockHeader>;

  /**
   * @method getCurrentEpoch
   * @memberof DefaultRPC
   * @description rpc to get the epoch info about the current epoch
   * @return {Promise<object>} epoch info, including block reward, difficulty, last_block_hash_in_previous_epoch,
   *                           length, number, remainder reward, start number
   */
  getCurrentEpoch: () => Promise<CKBComponents.Epoch>;

  /**
   * @method getEpochByNumber
   * @memberof DefaultRPC
   * @description rpc to get the epoch info by its number
   * @return {Promise<object>} epoch info
   */
  getEpochByNumber: (epoch: string | bigint) => Promise<CKBComponents.Epoch>;

  /**
   * @method getBlockHash
   * @memberof DefaultRPC
   * @description rpc to get the block hash by block number
   * @param {string} hash - block hash
   * @return {Promise<string>} block hash
   */
  getBlockHash: (
    number: CKBComponents.BlockNumber | bigint
  ) => Promise<CKBComponents.Hash>;

  /**
   * @method getBlock
   * @memberof DefaultRPC
   * @description rpc to get block by its hash
   * @param {string} hash
   * @param {string} verbosity
   * @param {boolean} withCycle
   * @return {Promise<BlockResponse | null>}
   */
  getBlock<
    V extends GetBlockVerbosityOptions = null,
    C extends GetBlockWithCycleOptions = null
  >(
    hash: CKBComponents.Hash,
    verbosity?: V,
    withCycle?: C
  ): Promise<BlockResponse<V, C> | null>;

  /**
   * @method getHeader
   * @memberof DefaultRPC
   * @description Returns the information about a block header by hash.
   * @params {Promise<string>} block hash
   */
  getHeader: GetHeader<CKBComponents.Hash>;

  /**
   * @method getHeaderByNumber
   * @memberof DefaultRPC
   * @description Returns the information about a block header by block number
   * @params {Promise<string>} block number
   */
  getHeaderByNumber: GetHeader<CKBComponents.BlockNumber | bigint>;

  /**
   * @method getLiveCell
   * @memberof DefaultRPC
   * @description rpc to get a cell by outPoint, the meaning of outPoint could be found in ckb-types,
   *              please distinguish outPoint and cellOutPoint
   * @param {object} outPoint - cell's outPoint
   * @param {boolean} withData - set withData to true to return cell data and data hash if the cell is live
   * @return {Promise<object>} liveCellWithStatus
   */
  getLiveCell: (
    outPoint: CKBComponents.OutPoint,
    withData: boolean
  ) => Promise<{
    cell: CKBComponents.LiveCell;
    status: CKBComponents.CellStatus;
  }>;

  /**
   * @method getTransaction
   * @memberof DefaultRPC
   * @description rpc to get trasnaction wtih its status by its hash
   * @param {string} hash - the transaction hash of the target transaction
   * @return {Promise<object>} transaction object with transaction status
   */
  getTransaction: GetTransaction;

  /**
   * @method getCellbaseOutputCapacityDetails
   * @memberof DefaultRPC
   * @description Returns each component of the created CKB in this block's cellbase, which is issued to
   *              a block N - 1 - ProposalWindow.farthest, where this block's height is N.
   * @param {string} blockHash
   *
   * @deprecated will be removed from v0.41.0
   */
  getCellbaseOutputCapacityDetails: (
    blockHash: CKBComponents.Hash
  ) => Promise<CKBComponents.CellbaseOutputCapacityDetails>;

  /**
   * @method getBlockEconomicState
   * @memberof DefaultRPC
   * @description
   * @param {string} blockHash
   * @returns {Promise<BlockEconomicState>}
   */
  getBlockEconomicState: (
    blockHash: CKBComponents.Hash
  ) => Promise<CKBComponents.BlockEconomicState>;

  /**
   * @method getTransactionProof
   * @memberof DefaultRPC
   * @description request merkle proof that transactions are included in a block
   * @param {Array<string>} transactionHashes - transaction hashes, all transactions must be in the same block
   * @param {Promise<[string]>} blockHash - if specified, looks for transactions in the block with this hash
   */
  getTransactionProof: (
    transactionHashes: CKBComponents.Hash[],
    blockHash?: CKBComponents.Hash
  ) => Promise<CKBComponents.TransactionProof>;

  /**
   * @method verifyTransactionProof
   * @memberof DefaultRPC
   * @description verifies that a proof points to transactions in a block, returns transactions it commits to.
   * @param {object} transactionProof
   * @returns {Promise<Array<string>>} hash list of transactions committed in the block
   */
  verifyTransactionProof: (
    transactionProof: CKBComponents.TransactionProof
  ) => Promise<CKBComponents.Hash[]>;

  /**
   * @method getConsensus
   * @memberof DefaultRPC
   * @description return various consensus parameters.
   * @returns {Promise<object>} consensus parameters
   */
  getConsensus: () => Promise<CKBComponents.Consensus>;

  /**
   * @method getBlockByNumber
   * @memberof DefaultRPC
   * @description rpc to get block by its hash
   * @param {CKBComponents.BlockNumber | bigint} number
   * @param {string} verbosity
   * @param {boolean} withCycle
   * @return {Promise<BlockResponse | null>}
   */
  getBlockByNumber<
    V extends GetBlockVerbosityOptions = null,
    C extends GetBlockWithCycleOptions = null
  >(
    number: CKBComponents.BlockNumber | bigint,
    verbosity?: V,
    withCycle?: C
  ): Promise<BlockResponse<V, C> | null>;

  /* Experimental */

  /**
   * @method dryRunTransaction
   * @memberof DefaultRPC
   * @description dry run the transaction and return the execution cycles, this method will not check the transaction
   *              validaty, but only run the lock script and type script and then return the execution cycles.
   * @param {object} rawTrasnaction - the raw transaction whose cycles is going to be calculated
   * @return {Promise<object>} dry run result, including cycles the transaction used.
   */
  dryRunTransaction: (
    tx: CKBComponents.RawTransaction
  ) => Promise<CKBComponents.RunDryResult>;

  calculateDaoMaximumWithdraw: (
    outPoint: CKBComponents.OutPoint,
    withdrawBlockHash: CKBComponents.Hash256
  ) => Promise<string>;

  /* skip Miner */

  /* Net */

  /**
   * @method localNodeInfo
   * @memberof DefaultRPC
   * @description rpc to get the local node information
   * @return {Promise<object>} node info, including addresses, is_outbound, node id, and version
   */
  localNodeInfo: () => Promise<CKBComponents.LocalNodeInfo>;

  /**
   * @method getPeers
   * @memberof DefaultRPC
   * @description rpc to get connected peers info
   * @return {Promise<object[]>} peers' node info
   *
   * @deprecated will be removed from v0.41.0
   */
  getPeers: () => Promise<CKBComponents.RemoteNodeInfo[]>;

  /**
   * @method getBannedAddresses
   * @memberof DefaultRPC
   * @description Returns all banned IPs/Subnets
   */
  getBannedAddresses: () => Promise<CKBComponents.BannedAddresses>;

  /**
   * @method clearBannedAddresses
   * @memberof DefaultRPC
   * @description clear all banned IPs/Subnets
   * @returns <null>
   */
  clearBannedAddresses: () => Promise<null>;

  /**
   * @method setBan
   * @memberof DefaultRPC
   * @description insert or delete an IP/Subnet from the banned list
   * @param {string} address, The IP/Subnet with an optional netmask (default is /32 = single IP)
   * @param {insert|delete} command, `insert` to insert an IP/Subnet to the list, `delete` to delete an IP/Subnet
   *                                 from the list
   * @param {string|null} ban_time, Time in milliseconds how long (or until when if [absolute] is set) the IP is banned,
   *                                optional parameter, null means using the default time of 24h
   * @param {[boolean]} absolute, If set, the `ban_time` must be an absolute timestamp in milliseconds since epoch,
   *                              optional parameter
   * @param {[string]} reason, Ban reason, optional parameter
   */

  setBan: (
    address: string,
    command: "insert" | "delete",
    banTime: string | null,
    absolute?: boolean,
    reason?: string
  ) => Promise<null>;

  /**
   * @method syncState
   * @memberof DefaultRPC
   * @description return sync state of this node
   */
  syncState: () => Promise<CKBComponents.SyncState>;

  /**
   * @method setNetworkActive
   * @memberof DefaultRPC
   * @description disable/enable all p2p network activity
   * @param {boolean} state - true to enable networking, false to disable
   */
  setNetworkActive: (state: boolean) => Promise<null>;

  /**
   * @method addNode
   * @memberof DefaultRPC
   * @description attempt to add a node to the peer list and try to connect
   * @param {string} peerId - the peer id of target node
   * @param {string} address - the address of target node
   * @returns {Promise<null>}
   */
  addNode: (peerId: string, address: string) => Promise<null>;

  /**
   * @method removeNode
   * @memberof DefaultRPC
   * @description attempt to remove a node from the peer list and try to disconnect
   * @param {string} peerId - the peer id of the target node
   * @returns {Promise<null>}
   */
  removeNode: (peerId: string) => Promise<null>;

  /**
   * @method pingPeers
   * @memberof DefaultRPC
   * @description request a ping sent to all connected peers to measure ping time
   * @returns {Promise<null>}
   */
  pingPeers: () => Promise<null>;

  /* Pool */

  /**
   * @method sendTransaction
   * @memberof DefaultRPC
   * @description rpc to send a new transaction into transaction pool
   * @param {object} rawTransaction - a raw transaction includes cell deps, inputs, outputs, version, and witnesses,
   *                                  detailed info could be found in ckb-types
   * @param {string} [outputsValidator] - Validates the transaction outputs before entering the tx-pool,
   *                                  an optional string parameter (enum: default | passthrough ),
   *                                  null and passthrough mean skipping outputs validation
   * @return {Promise<string>} transaction hash
   */
  sendTransaction: (
    tx: CKBComponents.RawTransaction,
    outputsValidator?: CKBComponents.OutputsValidator
  ) => Promise<CKBComponents.Hash>;

  /**
   * @method txPoolInfo
   * @memberof DefaultRPC
   * @description rpc to get pool information
   * @return {Promise<object>} info of transaction pool, including last_txs_updated_at, number of orphan,
   *                           number of pending, number of proposed
   */
  txPoolInfo: () => Promise<CKBComponents.TxPoolInfo>;

  /**
   * @method clearTxPool
   * @memberof DefaultRPC
   * @description remove all transactions from the tx pool
   * @return {Promise<null>}
   */
  clearTxPool: () => Promise<null>;

  /**
   * @method getRawTxPool
   * @memberof DefaultRPC
   * @param {boolean | null} verbose - true for a json object, false for array of transaction ids, default=false
   * @description Returns all transaction ids in tx pool as a json array of string transaction ids.
   * @return {Promise<object>} CKBComponents.RawTxPool
   */
  getRawTxPool(): Promise<CKBComponents.TxPoolIds>;
  getRawTxPool(verbose: true): Promise<CKBComponents.TxPoolVerbosity>;
  getRawTxPool(verbose: false | null): Promise<CKBComponents.TxPoolIds>;

  /* Stats */

  /**
   * @method getBlockchainInfo
   * @memberof DefaultRPC
   * @description rpc to get state info of the blockchain
   * @return {Promise<object>} blockchain info, including chain name, difficulty, epoch number,
   *                           is_intial_block_download, median time, warnings
   */
  getBlockchainInfo: () => Promise<CKBComponents.BlockchainInfo>;

  /* Indexer */

  /**
   * @method getIndexerTip
   * @memberof DefaultRPC
   * @description rpc to get tip info of the longest blockchain
   * @return {Promise<object>} tip info, including block number, block hash
   */
  getIndexerTip: () => Promise<CKBComponents.Tip>;

  /**
   * @method getCells
   * @memberof DefaultRPC
   * @description rpc to get a cell by script
   * @param {object} searchKey
   * @param {string} order - order cells by blocknumber "asc" or "desc"
   * @param {string} limit - limit the number of cells returned per call
   * @param {string} [cursor]
   * @return {Promise<object>} CKBComponents.GetLiveCellsResult
   */
  getCells: <WithData extends boolean = true>(
    searchKey: CKBComponents.GetCellsSearchKey<WithData>,
    order: CKBComponents.Order,
    limit: CKBComponents.Hash | bigint,
    cursor?: CKBComponents.Hash256
  ) => Promise<CKBComponents.GetLiveCellsResult<WithData>>;

  /**
   * @method getTransactions
   * @memberof DefaultRPC
   * @description rpc to get a transactions by script
   * @param {object} searchKey
   * @param {string} order - order cells by blocknumber "asc" or "desc"
   * @param {string} limit - limit the number of cells returned per call
   * @param {string} [cursor]
   * @return {Promise<object>} CKBComponents.GetTransactionsResult
   */
  getTransactions: <Group extends boolean = false>(
    searchKey: CKBComponents.GetTransactionsSearchKey<Group>,
    order: CKBComponents.Order,
    limit: CKBComponents.Hash | bigint,
    cursor?: CKBComponents.Hash256
  ) => Promise<CKBComponents.GetTransactionsResult<Group>>;

  /**
   * @method getCellsCapacity
   * @memberof DefaultRPC
   * @description rpc to get capacities by script
   * @param {object} searchKey
   * @return {Promise<object>} CKBComponents.CellsCapacity
   */
  getCellsCapacity: (
    searchKey: CKBComponents.SearchKey
  ) => Promise<CKBComponents.CellsCapacity>;

  /**
   * @method getBlockFilter
   * @param blockHash the block hash.
   * @returns The block filter by block hash.
   */
  getBlockFilter: (
    blockHash: CKBComponents.Hash256
  ) => Promise<CKBComponents.BlockFilter | null>;

  /**
   * @method getTransactionAndWitnessProof
   * @param txHashes Transaction hashes, all transactions must be in the same block
   * @param blockHash An optional parameter, if specified, looks for transactions in the block with this hash
   * @returns a Merkle proof of transactions’ witness included in a block
   */
  getTransactionAndWitnessProof: (
    txHashes: CKBComponents.Hash256[],
    blockHash?: CKBComponents.Hash256
  ) => Promise<CKBComponents.TransactionAndWitnessProof>;

  /**
   * @method verifyTransactionAndWitnessProof
   * @description Verifies that a proof points to transactions in a block
   * @param txProof proof generated by {@link Base.getTransactionAndWitnessProof}
   * @returns the transaction hashes it commits to
   */
  verifyTransactionAndWitnessProof: (
    txProof: CKBComponents.TransactionAndWitnessProof
  ) => Promise<CKBComponents.Hash256[]>;

  /**
   * @method getForkBlock
   * @param blockHash the fork block hash.
   * @param verbosity result format which allows 0 and 2. (Optional, the default is 2.)
   * @returns a fork block or null. When the RPC returns a block, the block hash must equal to the parameter `blockHash`.
   * Please note that due to the technical nature of the peer to peer sync, the RPC may return null or a fork block result on different nodes with same `block_hash` even they are fully synced to the canonical chain.
   * And because of chain reorganization, for the same `block_hash`, the RPC may sometimes return null and sometimes return the fork block.
   * When verbosity is 2, it returns a JSON object as the result. See BlockView for the schema.
   * When verbosity is 0, it returns a 0x-prefixed hex string as the result. The string encodes the block serialized by molecule using schema table Block.
   */
  getForkBlock(
    blockHash: CKBComponents.Hash256,
    verbosity?: 2n | "0x2"
  ): Promise<CKBComponents.BlockView | null>;
  getForkBlock(
    blockHash: CKBComponents.Hash256,
    verbosity: 0n | "0x0"
  ): Promise<CKBComponents.SerializedBlock | null>;

  /**
   * @method getBlockMedianTime
   * @param blockHash A median time is calculated for a consecutive block sequence. `blockHash` indicates the highest block of the sequence.
   * @returns the past median time by block hash.
   * When the given block hash is not on the current canonical chain, this RPC returns null;
   * otherwise returns the median time of the consecutive 37 blocks where the given block_hash has the highest height.
   * Note that the given block is included in the median time.
   * The included block number range is `[MAX(block - 36, 0), block]`.
   */
  getBlockMedianTime: (
    blockHash: CKBComponents.Hash256
  ) => Promise<CKBComponents.Timestamp | null>;

  /**
   * @method estimateCycles
   * run a transaction and return the execution consumed cycles
   * This method will not check the transaction validity, but only run the lock script and type script and then return the execution cycles.
   * @param tx
   * @returns how many cycles the scripts consume.
   */
  estimateCycles: (
    tx: CKBComponents.Transaction
  ) => Promise<CKBComponents.EstimateCycles>;

  /**
   * @method getFeeRateStatics
   * @deprecated Please use {@link Base.getFeeRateStatistics} instead
   * @param target Specify the number (1 - 101) of confirmed blocks to be counted. If the number is even, automatically add one. If not specified, defaults to 2
   * @returns the feeRate statistics of confirmed blocks on the chain
   */
  getFeeRateStatics: (
    target?: CKBComponents.UInt64
  ) => Promise<CKBComponents.FeeRateStatistics>;

  /**
   * @method getFeeRateStatistics
   * @param target Specify the number (1 - 101) of confirmed blocks to be counted. If the number is even, automatically add one. If not specified, defaults to 2
   * @returns the feeRate statistics of confirmed blocks on the chain If the query finds the corresponding historical data, the corresponding statistics are returned, containing the mean and median, in shannons per kilo-weight. If not, it returns null.
   */
  getFeeRateStatistics: (
    target?: CKBComponents.UInt64
  ) => Promise<CKBComponents.FeeRateStatistics>;

  getDeploymentsInfo: () => Promise<CKBComponents.DeploymentsInfo>;
}

export class Base {
  #rpcProperties: RpcPropertes = rpcProperties;

  get rpcProperties(): RpcPropertes {
    return this.#rpcProperties;
  }
}
