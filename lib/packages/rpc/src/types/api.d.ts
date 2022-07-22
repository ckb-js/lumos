/**
 * @see https://github.com/nervosnetwork/ckb/blob/develop/protocol/src/protocol.fbs for more infGomation
 */
export declare namespace CKBComponents {
    type DAO = string;
    type Hash = string;
    type Number = string;
    type Hash256 = string;
    type UInt32 = number;
    type Index = string;
    type Version = string;
    type Count = string;
    type Difficulty = string;
    type BlockNumber = string;
    type EpochInHeader = string;
    type Capacity = string;
    type ProposalShortId = string;
    type Timestamp = string;
    type Nonce = string;
    type Cycles = string;
    type Size = string;
    type OutputsValidator = 'default' | 'passthrough' | undefined;
    type RationalU256 = Record<'denom' | 'numer', string>;
    type ProposalWindow = Record<'closest' | 'farthest', BlockNumber>;
    type EpochNumberWithFraction = string;
    enum TransactionStatus {
        Pending = "pending",
        Proposed = "proposed",
        Committed = "committed"
    }
    type ScriptHashType = 'data' | 'type' | 'data1';
    type DepType = 'code' | 'depGroup';
    type JsonBytes = string;
    /**
     * @typedef Bytes, keep consistent with CKB
     * @description Bytes will be serialized to string
     * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs#L19
     */
    type Bytes = string;
    type Since = string;
    interface Node {
        url: string;
        httpAgent?: any;
        httpsAgent?: any;
    }
    interface Method {
        name: string;
        method: string;
        paramsFormatters: Function[];
        resultFormatters?: Function;
    }
    /**
     * RPC Units
     */
    /**
     * @typedef Script, lock or type script
     * @description Script, the script model in CKB. CKB scripts use UNIX standard execution environment.
     *              Each script binary should contain a main function with the following signature `int main(int argc, char* argv[]);`.
     *              CKB will concat  `args`, then use the concatenated array to fill `argc/argv` part, then start the script execution.
     *              Upon termination, the executed `main` function here will provide a return code,
     *              `0` means the script execution succeeds, other values mean the execution fails.
     * @property args, arguments.
     * @property codeHash, point to its dependency, if the referred dependency is listed in the deps field in a transaction,
     *                     the codeHash means the hash of the referred cell's data.
     * @property hashType, a enumerate indicates the type of the code which is referened by the code hash
     */
    interface Script {
        args: Bytes;
        codeHash: Hash256;
        hashType: ScriptHashType;
    }
    /**
     * @typedef CellInput, cell input in a transaction
     * @property previousOutput, point to its P1 cell
     * @property since, a parameter to prevent a cell to be spent before a centain block timestamp or a block number,
     *           [RFC](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0017-tx-valid-since/0017-tx-valid-since.md)
     */
    interface CellInput {
        previousOutput: OutPoint | undefined;
        since: Since;
    }
    /**
     * @typedef CellOutput, cell output in a transaction
     * @property capacity, the capacity of the genereated P1 cell
     * @property lock, lock script
     * @property type, type script
     */
    interface CellOutput {
        capacity: Capacity;
        lock: Script;
        type?: Script | undefined;
    }
    /**
     * @typedef OutPoint, used to refer a generated cell by transaction hash and output index
     * @property hash, transaction hash
     * @property index, index of cell output
     */
    interface OutPoint {
        txHash: Hash256;
        index: Index;
    }
    /**
     * @typeof CellDep, cell dependencies in a transaction
     * @property outPoint, the out point of the cell dependency
     * @property depType, indicate if the data of the cell containing a group of dependencies
     */
    interface CellDep {
        outPoint: OutPoint | undefined;
        depType: DepType;
    }
    type Witness = Bytes;
    /**
     * @typedef RawTransaction, raw transaction object
     * @property version, transaction version
     * @property cellDeps, cell deps used in the transaction
     * @property headerDeps, header deps referenced to a specific block used in the transaction
     * @property inputs, cell inputs in the transaction
     * @property outputs, cell outputs in the transaction
     * @property witnesses, segrated witnesses
     * @property outputsData, data referenced by scripts
     */
    interface RawTransaction {
        version: Version;
        cellDeps: CellDep[];
        headerDeps: Hash256[];
        inputs: CellInput[];
        outputs: CellOutput[];
        witnesses: Witness[];
        outputsData: Bytes[];
    }
    /**
     * @typedef Transaction, transaction object
     * @extends RawTransaction
     * @property hash, transaction hash
     */
    interface Transaction extends RawTransaction {
        hash: Hash256;
    }
    interface TransactionWithStatus {
        transaction: Transaction;
        txStatus: {
            blockHash: Hash256;
            status: TransactionStatus.Committed;
        } | {
            blockHash: undefined;
            status: TransactionStatus.Pending | TransactionStatus.Proposed;
        };
    }
    /**
     * @typeof TransactionPoint
     * @property blockNumber
     * @property index
     * @property txHash
     */
    interface TransactionPoint {
        blockNumber: BlockNumber;
        index: Index;
        txHash: Hash256;
    }
    /**
     * @TransactionByLockHash
     * @property consumedBy
     * @property createdBy
     */
    interface TransactionByLockHash {
        consumedBy: undefined | TransactionPoint;
        createdBy: TransactionPoint;
    }
    type TransactionsByLockHash = TransactionByLockHash[];
    /**
     * @typedef BlockHeader, header of a block
     * @property compactTarget
     * @property dao
     * @property epoch
     * @property hash
     * @property number
     * @property parentHash
     * @property proposalsHash
     * @property nonce
     * @property timestamp
     * @property transactionsRoot
     * @property extraHash
     * @property version
     */
    interface BlockHeader {
        compactTarget: Hash;
        dao: DAO;
        epoch: EpochInHeader;
        hash: Hash256;
        number: BlockNumber;
        parentHash: Hash256;
        proposalsHash: Hash256;
        nonce: Nonce;
        timestamp: Timestamp;
        transactionsRoot: Hash256;
        extraHash: Hash256;
        version: Version;
    }
    /**
     * @typedef UncleBlock, uncle block object
     * @property header, block header
     * @property proposals
     */
    interface UncleBlock {
        header: BlockHeader;
        proposals: ProposalShortId[];
    }
    /**
     * @typedef Block, block object
     * @property header, block header
     * @property uncles, uncle blocks
     * @property transactions
     * @property proposals
     * @property extension
     */
    interface Block {
        header: BlockHeader;
        uncles: UncleBlock[];
        transactions: Transaction[];
        proposals: ProposalShortId[];
        extension?: JsonBytes | undefined;
    }
    /**
     * @typedef Cell, cell object
     * @property capacty, cell capacity
     * @property lock, lock hash
     */
    interface Cell extends CellOutput {
    }
    /**
     * @typeof Live Cell
     * @property data, the data and data hash of the live cell
     * @property output, the previous cell the live cell derives from
     */
    interface LiveCell {
        data?: {
            content: Hash;
            hash: Hash256;
        };
        output: CellOutput;
    }
    /**
     * @typedef Cell, cell object
     * @property capacty, cell capacity
     * @property lock, lock hash
     * @property outPoint
     */
    interface CellIncludingOutPoint {
        blockHash: Hash256;
        capacity: Capacity;
        lock: Script;
        outPoint: OutPoint | undefined;
        cellbase: boolean;
        outputDataLen: string;
    }
    type TransactionTrace = {
        action: string;
        info: string;
        time: Timestamp;
    }[];
    enum CellStatus {
        Live = "live",
        Unknown = "unknown"
    }
    interface LiveCellByLockHash {
        cellOutput: CellOutput;
        createdBy: TransactionPoint;
        cellbase: boolean;
        outputDataLen: string;
    }
    type LiveCellsByLockHash = LiveCellByLockHash[];
    interface AlertMessage {
        id: string;
        priority: string;
        noticeUntil: Timestamp;
        message: string;
    }
    interface BlockchainInfo {
        isInitialBlockDownload: boolean;
        epoch: string;
        difficulty: string;
        medianTime: string;
        chain: string;
        alerts: AlertMessage[];
    }
    interface LocalNodeInfo {
        active: boolean;
        addresses: Record<'address' | 'score', string>[];
        connections: string;
        nodeId: string;
        protocols: {
            id: string;
            name: string;
            supportVersions: string[];
        }[];
        version: string;
    }
    interface RemoteNodeInfo {
        addresses: Record<'address' | 'score', string>[];
        connectedDuration: string;
        isOutbound: boolean;
        lastPingDuration: string;
        nodeId: string;
        protocols: Record<'id' | 'version', string>[];
        syncState: Record<'bestKnownHeaderHash' | 'bestKnownHeaderNumber' | 'canFetchCount' | 'inflightCount' | 'lastCommonHeaderHash' | 'lastCommonHeaderNumber' | 'unknownHeaderListSize', string | undefined>;
        version: string;
    }
    interface PeersState {
        lastUpdated: string;
        blocksInFlight: string;
        peer: string;
    }
    interface TxPoolInfo {
        lastTxsUpdatedAt: Timestamp;
        minFeeRate: string;
        orphan: Count;
        pending: Count;
        proposed: Count;
        tipHash: Hash256;
        tipNumber: BlockNumber;
        totalTxCycles: Cycles;
        totalTxSize: Size;
    }
    enum CapacityUnit {
        Shannon = 1,
        Byte = 100000000
    }
    interface Epoch {
        compactTarget: Hash;
        length: String;
        number: String;
        startNumber: String;
    }
    interface RunDryResult {
        cycles: Cycles;
    }
    interface LockHashIndexState {
        blockHash: Hash256;
        blockNumber: BlockNumber;
        lockHash: Hash256;
    }
    type LockHashIndexStates = LockHashIndexState[];
    interface BannedAddress {
        address: string;
        banReason: string;
        banUntil: Timestamp;
        createdAt: Timestamp;
    }
    type BannedAddresses = BannedAddress[];
    interface CellbaseOutputCapacityDetails {
        primary: string;
        proposalReward: string;
        secondary: string;
        total: string;
        txFee: string;
    }
    interface FeeRate {
        feeRate: string;
    }
    type BytesOpt = Bytes | undefined;
    interface WitnessArgs {
        lock: BytesOpt;
        inputType: BytesOpt;
        outputType: BytesOpt;
    }
    interface RawTransactionToSign extends Omit<RawTransaction, 'witnesses'> {
        witnesses: (WitnessArgs | Witness)[];
    }
    interface CapacityByLockHash {
        blockNumber: BlockNumber;
        capacity: Capacity;
        cellsCount: string;
    }
    interface BlockEconomicState {
        finalizedAt: string;
        issuance: {
            primary: string;
            secondary: string;
        };
        minerReward: {
            committed: string;
            primary: string;
            proposal: string;
            secondary: string;
        };
        txsFee: string;
    }
    interface SyncState {
        bestKnownBlockNumber: string;
        bestKnownBlockTimestamp: string;
        fastTime: string;
        ibd: boolean;
        inflightBlocksCount: string;
        lowTime: string;
        normalTime: string;
        orphanBlocksCount: string;
    }
    interface TransactionProof {
        blockHash: Hash;
        proof: {
            indices: Number[];
            lemmas: Hash[];
        };
        witnessesRoot: Hash;
    }
    type TxPoolIds = Record<'pending' | 'proposed', Array<Hash256>>;
    interface TxVerbosity {
        cycles: Cycles;
        size: Size;
        fee: Capacity;
        ancestorsSize: Size;
        ancestorsCycles: Cycles;
        ancestorsCount: Count;
    }
    type TxPoolVerbosity = Record<'pending' | 'proposed', Record<Hash256, TxVerbosity>>;
    type RawTxPool = TxPoolIds | TxPoolVerbosity;
    interface Consensus {
        id: string;
        genesisHash: Hash256;
        hardforkFeatures: Array<{
            rfc: string;
            epochNumber: string | undefined;
        }>;
        daoTypeHash: Hash256 | undefined;
        secp256k1Blake160SighashAllTypeHash: Hash256 | undefined;
        secp256k1Blake160MultisigAllTypeHash: Hash256 | undefined;
        initialPrimaryEpochReward: Capacity;
        secondaryEpochReward: Capacity;
        maxUnclesNum: string;
        orphanRateTarget: RationalU256;
        epochDurationTarget: string;
        txProposalWindow: ProposalWindow;
        proposerRewardRatio: RationalU256;
        cellbaseMaturity: EpochNumberWithFraction;
        medianTimeBlockCount: Count;
        maxBlockCycles: Cycles;
        maxBlockBytes: string;
        blockVersion: Version;
        txVersion: Version;
        typeIdCodeHash: Hash256;
        maxBlockProposalsLimit: string;
        primaryEpochRewardHalvingInterval: string;
        permanentDifficultyInDummy: boolean;
    }
}
