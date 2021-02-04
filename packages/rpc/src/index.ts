import { RPC as ToolkitRPC } from "ckb-js-toolkit";
import {
  Alert,
  BannedAddr,
  Block,
  BlockEconomicState,
  CellWithStatus,
  ChainInfo,
  Consensus,
  DryRunResult,
  Epoch,
  Hash,
  Header,
  HexNumber,
  HexString,
  Indexer,
  LocalNode,
  OutPoint,
  RawTxPool,
  RemoteNode,
  SyncState,
  Transaction,
  TransactionProof,
  TransactionWithStatus,
  TxPoolIds,
  TxPoolInfo,
  TxPoolVerbosity,
} from "@ckb-lumos/base";

export type SerializedBlock = HexString;
export type SerializedHeader = HexString;
export type OutputsValidator = "default" | "passthrough";

function asyncSleep(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}

const handler = {
  get: (target: any, method: string) => {
    return async (...params: any) => {
      const result = await target.rpc[method](...params);
      if (target.indexer) {
        await target.waitForBlockSync();
      }
      return result;
    };
  },
};

class RpcProxy {
  private rpc: ToolkitRPC;
  private indexer: Indexer | undefined;
  private waitForSyncCheckIntervalSeconds: number;
  private blockDifference: number;

  constructor(
    uri: string,
    indexer?: Indexer,
    {
      waitForSyncCheckIntervalSeconds = 1,
      blockDifference = 3,
      rpcOptions = {},
    }: {
      waitForSyncCheckIntervalSeconds?: number;
      blockDifference?: number;
      rpcOptions?: object;
    } = {}
  ) {
    this.rpc = new ToolkitRPC(uri, rpcOptions);
    this.indexer = indexer;
    this.waitForSyncCheckIntervalSeconds = waitForSyncCheckIntervalSeconds;
    this.blockDifference = blockDifference;
  }

  resetIndexer(indexer?: Indexer): void {
    this.indexer = indexer;
  }

  getProxy() {
    return new Proxy(this, handler);
  }

  async waitForBlockSync() {
    if (!this.indexer) {
      return;
    }
    const header: Header = await this.rpc.get_tip_header();
    const blockNumber = BigInt(header.number);
    while (true) {
      const tip = await this.indexer.tip();
      if (tip) {
        const indexedNumber = BigInt(tip.block_number);
        if (blockNumber - indexedNumber <= this.blockDifference) {
          // TODO: do we need to handle forks?
          break;
        }
      }
      await asyncSleep(this.waitForSyncCheckIntervalSeconds * 1000);
    }
  }
}

export class RPC {
  private rpcProxy: any;

  /**
   *
   * @param uri
   * @param indexer Will `waitForSync` after rpc call if provided.
   * @param options
   */
  constructor(
    uri: string,
    indexer?: Indexer,
    {
      waitForSyncCheckIntervalSeconds = 1,
      blockDifference = 3,
      rpcOptions = {},
    }: {
      waitForSyncCheckIntervalSeconds?: number;
      blockDifference?: number;
      rpcOptions?: object;
    } = {}
  ) {
    this.rpcProxy = new RpcProxy(uri, indexer, {
      waitForSyncCheckIntervalSeconds,
      blockDifference,
      rpcOptions,
    }).getProxy();
  }

  /**
   *
   * @param indexer If not provided or be undefined, will disable `waitForSync`, and if provided, will enable `waitForSync` with provided indexer.
   */
  resetIndexer(indexer?: Indexer): void {
    this.rpcProxy.resetIndexer(indexer);
  }

  // Module Chain

  async get_block(
    block_hash: Hash,
    verbosity: "0x0"
  ): Promise<SerializedBlock | null>;
  async get_block(block_hash: Hash, verbosity?: "0x2"): Promise<Block | null>;
  async get_block(
    block_hash: Hash,
    verbosity?: HexNumber
  ): Promise<Block | SerializedBlock | null> {
    return this.rpcProxy.get_block(block_hash, verbosity || null);
  }

  async get_block_by_number(
    block_number: HexNumber,
    verbosity: "0x0"
  ): Promise<SerializedBlock | null>;
  async get_block_by_number(
    block_number: HexNumber,
    verbosity?: "0x2"
  ): Promise<Block | null>;
  async get_block_by_number(
    block_number: HexNumber,
    verbosity?: HexNumber
  ): Promise<Block | SerializedBlock | null> {
    return this.rpcProxy.get_block_by_number(block_number, verbosity || null);
  }

  async get_header(
    block_hash: Hash,
    verbosity: "0x0"
  ): Promise<SerializedHeader | null>;
  async get_header(block_hash: Hash, verbosity?: "0x1"): Promise<Header | null>;
  async get_header(
    block_hash: Hash,
    verbosity?: HexNumber
  ): Promise<Header | SerializedHeader | null> {
    return this.rpcProxy.get_header(block_hash, verbosity || null);
  }

  async get_header_by_number(
    block_number: HexNumber,
    verbosity: "0x0"
  ): Promise<SerializedHeader | null>;
  async get_header_by_number(
    block_number: HexNumber,
    verbosity?: "0x1"
  ): Promise<Header | null>;
  async get_header_by_number(
    block_number: HexNumber,
    verbosity?: HexNumber
  ): Promise<Header | SerializedHeader | null> {
    return this.rpcProxy.get_header_by_number(block_number, verbosity || null);
  }

  async get_transaction(hash: Hash): Promise<TransactionWithStatus | null> {
    return this.rpcProxy.get_transaction(hash);
  }

  async get_block_hash(block_number: HexNumber): Promise<Hash | null> {
    return this.rpcProxy.get_block_hash(block_number);
  }

  async get_tip_header(verbosity: "0x0"): Promise<SerializedHeader>;
  async get_tip_header(verbosity?: "0x1"): Promise<Header>;
  async get_tip_header(
    verbosity?: HexNumber
  ): Promise<Header | SerializedHeader> {
    return this.rpcProxy.get_tip_header(verbosity);
  }

  async get_live_cell(
    out_point: OutPoint,
    with_data: boolean
  ): Promise<CellWithStatus> {
    return this.rpcProxy.get_live_cell(out_point, with_data);
  }

  async get_tip_block_number(): Promise<HexNumber> {
    return this.rpcProxy.get_tip_block_number();
  }

  async get_current_epoch(): Promise<Epoch> {
    return this.rpcProxy.get_current_epoch();
  }

  async get_epoch_by_number(epoch_number: HexNumber): Promise<Epoch | null> {
    return this.rpcProxy.get_epoch_by_number(epoch_number);
  }

  async get_block_economic_state(
    block_hash: Hash
  ): Promise<BlockEconomicState | null> {
    return this.rpcProxy.get_block_economic_state(block_hash);
  }

  async get_transaction_proof(
    tx_hashes: Hash[],
    block_hash?: Hash
  ): Promise<TransactionProof> {
    return this.rpcProxy.get_transaction_proof(tx_hashes, block_hash || null);
  }

  async verify_transaction_proof(tx_proof: TransactionProof): Promise<Hash[]> {
    return this.rpcProxy.verify_transaction_proof(tx_proof);
  }

  async get_fork_block(
    block_hash: Hash,
    verbosity: "0x0"
  ): Promise<SerializedBlock | null>;
  async get_fork_block(
    block_hash: Hash,
    verbosity?: "0x2"
  ): Promise<Block | null>;
  async get_fork_block(
    block_hash: Hash,
    verbosity?: HexNumber
  ): Promise<Block | SerializedBlock | null> {
    return this.rpcProxy.get_fork_block(
      block_hash,
      verbosity ? verbosity : null
    );
  }

  async get_consensus(): Promise<Consensus> {
    return this.rpcProxy.get_consensus();
  }

  // Module Experiment

  async dry_run_transaction(tx: Transaction): Promise<DryRunResult> {
    return this.rpcProxy.dry_run_transaction(tx);
  }

  async calculate_dao_maximum_withdraw(
    out_point: OutPoint,
    block_hash: Hash
  ): Promise<HexNumber> {
    return this.rpcProxy.calculate_dao_maximum_withdraw(out_point, block_hash);
  }

  // Module Net

  async local_node_info(): Promise<LocalNode> {
    return this.rpcProxy.local_node_info();
  }

  async get_peers(): Promise<RemoteNode[]> {
    return this.rpcProxy.get_peers();
  }

  async get_banned_addresses(): Promise<BannedAddr> {
    return this.rpcProxy.get_banned_addresses();
  }

  async clear_banned_addresses(): Promise<null> {
    return this.rpcProxy.clear_banned_addresses();
  }

  async set_ban(
    address: string,
    command: string,
    ban_time?: HexNumber,
    absolute?: boolean,
    reason?: string
  ): Promise<null> {
    return this.rpcProxy.set_ban(
      address,
      command,
      ban_time || null,
      absolute !== undefined ? absolute : null,
      reason || null
    );
  }

  async sync_state(): Promise<SyncState> {
    return this.rpcProxy.sync_state();
  }

  async set_network_active(state: boolean): Promise<null> {
    return this.rpcProxy.set_network_active(state);
  }

  async add_node(peer_id: string, address: string): Promise<null> {
    return this.rpcProxy.add_node(peer_id, address);
  }

  async remove_node(peer_id: string): Promise<null> {
    return this.rpcProxy.remove_node(peer_id);
  }

  async ping_peers(): Promise<null> {
    return this.rpcProxy.ping_peers();
  }

  // Module pool

  async send_transaction(
    tx: Transaction,
    outputs_validator?: OutputsValidator
  ): Promise<Hash> {
    return this.rpcProxy.send_transaction(tx, outputs_validator || null);
  }

  async tx_pool_info(): Promise<TxPoolInfo> {
    return this.rpcProxy.tx_pool_info();
  }

  async clear_tx_pool(): Promise<null> {
    return this.rpcProxy.clear_tx_pool();
  }

  async get_raw_tx_pool(verbose?: false): Promise<TxPoolIds>;
  async get_raw_tx_pool(verbose: true): Promise<TxPoolVerbosity>;
  async get_raw_tx_pool(verbose?: boolean): Promise<RawTxPool> {
    return this.rpcProxy.get_raw_tx_pool(
      verbose !== undefined ? verbose : null
    );
  }

  // Module Stats

  async get_blockchain_info(): Promise<ChainInfo> {
    return this.rpcProxy.get_blockchain_info();
  }

  // Module Alert

  async send_alert(alert: Alert): Promise<null> {
    return this.rpcProxy.send_alert(alert);
  }

  // Module Miner
}
