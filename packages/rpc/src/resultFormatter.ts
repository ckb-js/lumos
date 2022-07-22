import { CKBComponents } from "./types/api";
import { RPC } from "./types/rpc";

const isTxPoolIds = (rawTxPool: RPC.RawTxPool): rawTxPool is RPC.TxPoolIds => {
  return Array.isArray(rawTxPool.pending);
};

/* eslint-disable camelcase */
const toNumber = (number: RPC.BlockNumber): CKBComponents.BlockNumber =>
  number.toString();
const toHash = (hash: RPC.Hash256): CKBComponents.Hash256 => hash;
const toHeader = (header: RPC.Header): CKBComponents.BlockHeader => {
  if (!header) return header;
  const {
    compact_target: compactTarget,
    transactions_root: transactionsRoot,
    proposals_hash: proposalsHash,
    extra_hash: extraHash,
    parent_hash: parentHash,
    ...rest
  } = header;
  return {
    compactTarget,
    parentHash,
    transactionsRoot,
    proposalsHash,
    extraHash,
    ...rest,
  };
};
const toScript = (script: RPC.Script): CKBComponents.Script => {
  if (!script) return script;
  const { code_hash: codeHash, hash_type: hashType, ...rest } = script;
  return {
    codeHash,
    hashType,
    ...rest,
  };
};
const toInput = (input: RPC.CellInput): CKBComponents.CellInput => {
  if (!input) return input;
  const { previous_output: previousOutput, ...rest } = input;
  return {
    previousOutput: previousOutput
      ? toOutPoint(previousOutput)
      : previousOutput,
    ...rest,
  };
};
const toOutput = (output: RPC.CellOutput): CKBComponents.CellOutput => {
  if (!output) return output;
  const { lock, type, ...rest } = output;
  return {
    lock: toScript(lock),
    type: type ? toScript(type) : type,
    ...rest,
  };
};
const toOutPoint = (
  outPoint: RPC.OutPoint | undefined
): CKBComponents.OutPoint | undefined => {
  if (!outPoint) return outPoint;
  const { tx_hash: txHash, ...rest } = outPoint;
  return {
    txHash,
    ...rest,
  };
};
const toDepType = (type: RPC.DepType) => {
  if (type === "dep_group") {
    return "depGroup";
  }
  return type;
};

const toCellDep = (cellDep: RPC.CellDep): CKBComponents.CellDep => {
  if (!cellDep) return cellDep;
  const {
    out_point: outPoint = undefined,
    dep_type = "code",
    ...rest
  } = cellDep;
  return {
    outPoint: toOutPoint(outPoint),
    depType: toDepType(dep_type),
    ...rest,
  };
};
function toTransaction(tx: RPC.RawTransaction): CKBComponents.RawTransaction;
function toTransaction(tx: RPC.Transaction): CKBComponents.Transaction;
function toTransaction(tx: RPC.RawTransaction | RPC.Transaction): any {
  if (!tx) return tx;
  const {
    cell_deps: cellDeps = [],
    inputs = [],
    outputs = [],
    outputs_data: outputsData = [],
    header_deps: headerDeps = [],
    ...rest
  } = tx;
  return {
    cellDeps: cellDeps.map(toCellDep),
    inputs: inputs.map(toInput),
    outputs: outputs.map(toOutput),
    outputsData,
    headerDeps,
    ...rest,
  };
}
const toUncleBlock = (uncleBlock: RPC.UncleBlock): CKBComponents.UncleBlock => {
  if (!uncleBlock) return uncleBlock;
  const { header, ...rest } = uncleBlock;
  return {
    header: toHeader(header),
    ...rest,
  };
};

const toBlock = (block: RPC.Block): CKBComponents.Block => {
  if (!block) return block;
  const { header, uncles = [], transactions = [], ...rest } = block;
  return {
    header: toHeader(header),
    uncles: uncles.map(toUncleBlock),
    transactions: transactions.map(toTransaction),
    ...rest,
  };
};
const toAlertMessage = (
  alertMessage: RPC.AlertMessage
): CKBComponents.AlertMessage => {
  if (!alertMessage) return alertMessage;
  const { notice_until: noticeUntil, ...rest } = alertMessage;
  return {
    noticeUntil,
    ...rest,
  };
};
const toBlockchainInfo = (
  info: RPC.BlockchainInfo
): CKBComponents.BlockchainInfo => {
  if (!info) return info;
  const {
    is_initial_block_download: isInitialBlockDownload,
    median_time: medianTime,
    alerts,
    ...rest
  } = info;
  return {
    isInitialBlockDownload,
    medianTime,
    alerts: alerts.map(toAlertMessage),
    ...rest,
  };
};
const toLocalNodeInfo = (
  info: RPC.LocalNodeInfo
): CKBComponents.LocalNodeInfo => {
  if (!info) return info;
  const { node_id: nodeId, protocols, ...rest } = info;
  return {
    nodeId,
    protocols: protocols.map(
      ({ id, name, support_versions: supportVersions }) => ({
        id,
        name,
        supportVersions,
      })
    ),
    ...rest,
  };
};
const toRemoteNodeInfo = (
  info: RPC.RemoteNodeInfo
): CKBComponents.RemoteNodeInfo => {
  if (!info) return info;
  const {
    node_id: nodeId,
    connected_duration: connectedDuration,
    is_outbound: isOutbound,
    last_ping_duration: lastPingDuration,
    sync_state,
    ...rest
  } = info;
  return {
    nodeId,
    connectedDuration,
    isOutbound,
    lastPingDuration,
    syncState: {
      bestKnownHeaderHash: sync_state.best_known_header_hash,
      bestKnownHeaderNumber: sync_state.best_known_header_number,
      canFetchCount: sync_state.can_fetch_count,
      inflightCount: sync_state.inflight_count,
      lastCommonHeaderHash: sync_state.last_common_header_hash,
      lastCommonHeaderNumber: sync_state.last_common_header_number,
      unknownHeaderListSize: sync_state.unknown_header_list_size,
    },
    ...rest,
  };
};
const toTxPoolInfo = (info: RPC.TxPoolInfo): CKBComponents.TxPoolInfo => {
  if (!info) return info;
  const {
    last_txs_updated_at: lastTxsUpdatedAt,
    tip_hash: tipHash,
    tip_number: tipNumber,
    total_tx_cycles: totalTxCycles,
    total_tx_size: totalTxSize,
    min_fee_rate: minFeeRate,
    ...rest
  } = info;
  return {
    lastTxsUpdatedAt,
    tipHash,
    tipNumber,
    totalTxCycles,
    totalTxSize,
    minFeeRate,
    ...rest,
  };
};
const toPeers = (
  nodes: RPC.RemoteNodeInfo[]
): CKBComponents.RemoteNodeInfo[] => {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(toRemoteNodeInfo);
};
const toCell = (cell: RPC.Cell): CKBComponents.Cell => {
  if (!cell) return cell;
  const { lock, type, ...rest } = cell;
  return {
    lock: toScript(lock),
    type: type ? toScript(type) : undefined,
    ...rest,
  };
};
const toLiveCell = (liveCell: RPC.LiveCell): CKBComponents.LiveCell => {
  if (!liveCell) return liveCell;
  const { data, output, ...rest } = liveCell;
  return {
    data,
    output: toOutput(output),
    ...rest,
  };
};
const toLiveCellWithStatus = (cellWithStatus: {
  cell: RPC.LiveCell;
  status: string;
}): { cell: CKBComponents.LiveCell; status: string } => {
  if (!cellWithStatus) return cellWithStatus;
  const { cell, ...rest } = cellWithStatus;
  return {
    cell: toLiveCell(cell),
    ...rest,
  };
};
const toCells = (cells: RPC.Cell[]): CKBComponents.Cell[] => {
  if (!Array.isArray(cells)) return [];
  return cells.map(toCell);
};
const toCellIncludingOutPoint = (cell: RPC.CellIncludingOutPoint) => {
  if (!cell) return cell;
  const {
    lock,
    block_hash: blockHash,
    out_point,
    output_data_len: outputDataLen,
    ...rest
  } = cell;
  return {
    blockHash,
    lock: toScript(lock),
    outPoint: toOutPoint(out_point),
    outputDataLen,
    ...rest,
  };
};
const toCellsIncludingOutPoint = (
  cells: RPC.CellIncludingOutPoint[]
): CKBComponents.CellIncludingOutPoint[] => {
  if (!Array.isArray(cells)) return [];
  return cells.map(toCellIncludingOutPoint);
};
const toTransactionWithStatus = (txWithStatus: RPC.TransactionWithStatus) => {
  if (!txWithStatus) return txWithStatus;
  const {
    transaction,
    tx_status: { block_hash: blockHash, status },
    ...rest
  } = txWithStatus;
  return {
    transaction: toTransaction(transaction),
    txStatus: {
      blockHash,
      status,
    },
    ...rest,
  };
};
const toEpoch = (epoch: RPC.Epoch): CKBComponents.Epoch => {
  if (!epoch) return epoch;
  const {
    start_number: startNumber,
    compact_target: compactTarget,
    ...rest
  } = epoch;
  return {
    compactTarget,
    startNumber,
    ...rest,
  };
};
const toTransactionPoint = (
  transactionPoint: RPC.TransactionPoint
): CKBComponents.TransactionPoint => {
  if (!transactionPoint) return transactionPoint;
  const {
    block_number: blockNumber,
    tx_hash: txHash,
    ...rest
  } = transactionPoint;
  return {
    blockNumber,
    txHash,
    ...rest,
  };
};
const toTransactionsByLockHash = (
  transactions: RPC.TransactionsByLockHash
): CKBComponents.TransactionsByLockHash => {
  if (!transactions) return transactions;
  return transactions.map((tx) => ({
    consumedBy: tx.consumed_by
      ? toTransactionPoint(tx.consumed_by)
      : tx.consumed_by,
    createdBy: toTransactionPoint(tx.created_by),
  }));
};
const toLiveCellsByLockHash = (
  cells: RPC.LiveCellsByLockHash
): CKBComponents.LiveCellsByLockHash => {
  if (!cells) return cells;
  return cells.map((cell) => ({
    cellOutput: toCell(cell.cell_output),
    createdBy: toTransactionPoint(cell.created_by),
    cellbase: cell.cellbase,
    outputDataLen: cell.output_data_len,
  }));
};
const toLockHashIndexState = (
  index: RPC.LockHashIndexState
): CKBComponents.LockHashIndexState => {
  if (!index) return index;
  const {
    block_hash: blockHash,
    block_number: blockNumber,
    lock_hash: lockHash,
    ...rest
  } = index;
  return {
    blockHash,
    blockNumber,
    lockHash,
    ...rest,
  };
};
const toLockHashIndexStates = (
  states: RPC.LockHashIndexStates
): CKBComponents.LockHashIndexStates => {
  if (!states) return states;
  return states.map(toLockHashIndexState);
};
const toBannedAddress = (
  bannedAddress: RPC.BannedAddress
): CKBComponents.BannedAddress => {
  if (!bannedAddress) return bannedAddress;
  const {
    ban_reason: banReason,
    ban_until: banUntil,
    created_at: createdAt,
    ...rest
  } = bannedAddress;
  return {
    banReason,
    banUntil,
    createdAt,
    ...rest,
  };
};
const toBannedAddresses = (
  bannedAddresses: RPC.BannedAddresses
): CKBComponents.BannedAddresses => {
  if (!bannedAddresses) return bannedAddresses;
  return bannedAddresses.map((banAddr) => toBannedAddress(banAddr));
};
const toCellbaseOutputCapacityDetails = (
  details: RPC.CellbaseOutputCapacityDetails
): CKBComponents.CellbaseOutputCapacityDetails => {
  if (!details) return details;
  const { proposal_reward: proposalReward, tx_fee: txFee, ...rest } = details;
  return {
    proposalReward,
    txFee,
    ...rest,
  };
};

const toFeeRate = (feeRateObj: RPC.FeeRate): CKBComponents.FeeRate => {
  if (!feeRateObj) {
    return feeRateObj;
  }
  const { fee_rate: feeRate, ...rest } = feeRateObj;
  return {
    feeRate,
    ...rest,
  };
};
const toCapacityByLockHash = (
  capacityByLockHash: RPC.CapacityByLockHash
): CKBComponents.CapacityByLockHash => {
  if (!capacityByLockHash) {
    return capacityByLockHash;
  }
  const {
    cells_count: cellsCount,
    block_number: blockNumber,
    capacity,
    ...rest
  } = capacityByLockHash;
  return {
    blockNumber,
    capacity,
    cellsCount,
    ...rest,
  };
};
const toBlockEconomicState = (
  blockEconomicState: RPC.BlockEconomicState
): CKBComponents.BlockEconomicState => {
  if (!blockEconomicState) {
    return blockEconomicState;
  }
  const {
    finalized_at: finalizedAt,
    miner_reward: minerReward,
    txs_fee: txsFee,
    ...rest
  } = blockEconomicState;
  return {
    finalizedAt,
    minerReward,
    txsFee,
    ...rest,
  };
};
const toSyncState = (state: RPC.SyncState): CKBComponents.SyncState => {
  if (!state) {
    return state;
  }
  return {
    bestKnownBlockNumber: state.best_known_block_number,
    bestKnownBlockTimestamp: state.best_known_block_timestamp,
    fastTime: state.fast_time,
    ibd: state.ibd,
    inflightBlocksCount: state.inflight_blocks_count,
    lowTime: state.low_time,
    normalTime: state.normal_time,
    orphanBlocksCount: state.orphan_blocks_count,
  };
};
const toTransactionProof = (
  proof: RPC.TransactionProof
): CKBComponents.TransactionProof => {
  if (!proof) {
    return proof;
  }
  const {
    block_hash: blockHash,
    witnesses_root: witnessesRoot,
    ...rest
  } = proof;
  return {
    blockHash,
    witnessesRoot,
    ...rest,
  };
};
const toConsensus = (consensus: RPC.Consensus): CKBComponents.Consensus => {
  if (!consensus) return consensus;
  return {
    blockVersion: consensus.block_version,
    cellbaseMaturity: consensus.cellbase_maturity,
    daoTypeHash: consensus.dao_type_hash,
    epochDurationTarget: consensus.epoch_duration_target,
    genesisHash: consensus.genesis_hash,
    id: consensus.id,
    initialPrimaryEpochReward: consensus.initial_primary_epoch_reward,
    maxBlockBytes: consensus.max_block_bytes,
    maxBlockCycles: consensus.max_block_cycles,
    maxBlockProposalsLimit: consensus.max_block_proposals_limit,
    maxUnclesNum: consensus.max_uncles_num,
    medianTimeBlockCount: consensus.median_time_block_count,
    orphanRateTarget: consensus.orphan_rate_target,
    permanentDifficultyInDummy: consensus.permanent_difficulty_in_dummy,
    primaryEpochRewardHalvingInterval:
      consensus.primary_epoch_reward_halving_interval,
    proposerRewardRatio: consensus.proposer_reward_ratio,
    secondaryEpochReward: consensus.secondary_epoch_reward,
    secp256k1Blake160MultisigAllTypeHash:
      consensus.secp256k1_blake160_multisig_all_type_hash,
    secp256k1Blake160SighashAllTypeHash:
      consensus.secp256k1_blake160_sighash_all_type_hash,
    txProposalWindow: consensus.tx_proposal_window,
    txVersion: consensus.tx_version,
    typeIdCodeHash: consensus.type_id_code_hash,
    hardforkFeatures:
      consensus.hardfork_features?.map(
        ({ epoch_number: epochNumber, ...rest }) => ({ epochNumber, ...rest })
      ) ?? consensus.hardfork_features,
  };
};

const toRawTxPool = (rawTxPool: RPC.RawTxPool): CKBComponents.RawTxPool => {
  if (!rawTxPool) return rawTxPool;

  if (isTxPoolIds(rawTxPool)) {
    return rawTxPool;
  }

  const toTxVerbosity = ({
    ancestors_count: ancestorsCount,
    ancestors_cycles: ancestorsCycles,
    ancestors_size: ancestorsSize,
    ...rest
  }: RPC.TxVerbosity): CKBComponents.TxVerbosity => ({
    ancestorsCount,
    ancestorsCycles,
    ancestorsSize,
    ...rest,
  });
  const proposed: Record<CKBComponents.Hash256, CKBComponents.TxVerbosity> = {};
  const pending: Record<CKBComponents.Hash256, CKBComponents.TxVerbosity> = {};

  Object.keys(rawTxPool.proposed).forEach((hash) => {
    proposed[hash] = toTxVerbosity(rawTxPool.proposed[hash]);
  });

  Object.keys(rawTxPool.pending).forEach((hash) => {
    pending[hash] = toTxVerbosity(rawTxPool.pending[hash]);
  });

  return { proposed, pending };
};

export default {
  toNumber,
  toHash,
  toHeader,
  toScript,
  toInput,
  toOutput,
  toOutPoint,
  toDepType,
  toCellDep,
  toTransaction,
  toUncleBlock,
  toBlock,
  toAlertMessage,
  toBlockchainInfo,
  toLocalNodeInfo,
  toRemoteNodeInfo,
  toTxPoolInfo,
  toPeers,
  toLiveCell,
  toLiveCellWithStatus,
  toCell,
  toCells,
  toCellIncludingOutPoint,
  toCellsIncludingOutPoint,
  toTransactionWithStatus,
  toEpoch,
  toTransactionPoint,
  toTransactionsByLockHash,
  toLiveCellsByLockHash,
  toLockHashIndexState,
  toLockHashIndexStates,
  toBannedAddress,
  toBannedAddresses,
  toCellbaseOutputCapacityDetails,
  toFeeRate,
  toCapacityByLockHash,
  toBlockEconomicState,
  toSyncState,
  toTransactionProof,
  toConsensus,
  toRawTxPool,
};
/* eslint-enable camelcase */
