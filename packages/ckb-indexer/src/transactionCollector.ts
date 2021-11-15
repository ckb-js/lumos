import {
  TransactionCollectorOptions,
  indexer as BaseIndexerModule,
  Transaction,
  Output,
  OutPoint,
  TransactionWithStatus,
} from "@ckb-lumos/base";
import intersectionBy from "lodash.intersectionby";
import {
  SearchKeyFilter,
  CkbQueryOptions,
  GetTransactionsResult,
  GetTransactionsResults,
  IOType,
  Order,
  CkbIndexer,
} from "./indexer";
import {
  generateSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
  requestBatch,
  request,
} from "./services";

interface GetTransactionDetailResult {
  objects: TransactionWithStatus[];
  lastCursor: string | undefined;
}

interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: TransactionWithStatus;
}

interface TransactionWithIOType extends TransactionWithStatus {
  inputCell?: Output;
  ioType: IOType;
  ioIndex: string;
}

export class CKBTransactionCollector extends BaseIndexerModule.TransactionCollector {
  filterOptions: TransactionCollectorOptions;
  constructor(
    public indexer: CkbIndexer,
    public queries: CkbQueryOptions,
    public CKBRpcUrl: string,
    public options?: TransactionCollectorOptions
  ) {
    super(indexer, queries, options);
    const defaultOptions: TransactionCollectorOptions = {
      skipMissing: false,
      includeStatus: true,
    };
    this.filterOptions = { ...defaultOptions, ...this.options };
  }

  /*
   *lock?: ScriptWrapper.script query by ckb-indexer,ScriptWrapper.ioType filter after get transaction from indexer, ScriptWrapper.argsLen filter after get transaction from rpc;
   *type?:  ScriptWrapper.script query by ckb-indexer,ScriptWrapper.ioType filter after get transaction from indexer, ScriptWrapper.argsLen filter after get transaction from rpc;
   *data?: will not filter
   *argsLen?: filter after get transaction detail;
   *fromBlock?: query by ckb-indexer;
   *toBlock?: query by ckb-indexer;
   *skip?: filter after get transaction from ckb-indexer;;
   *order?: query by ckb-indexer;
   */
  private async getTransactions(
    lastCursor?: string,
    skip?: number
  ): Promise<GetTransactionDetailResult> {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      searchKeyFilter.lastCursor = lastCursor;
    }
    let transactionHashList: GetTransactionsResults = {
      objects: [],
      lastCursor: "",
    };
    /*
     * if both lock and type exist,we need search them in independent and then get intersection
     * cause ckb-indexer use searchKey script on each cell but native indexer use lock and type on transaction,
     * and one transaction may have many cells both in input and output, more detail in test 'Test query transaction by both input lock and output type script'
     */

    //if both lock and type, search search them in independent and then get intersection, GetTransactionsResults.lastCursor change to `${lockLastCursor}-${typeLastCursor}`
    if (
      instanceOfScriptWrapper(this.queries.lock) &&
      instanceOfScriptWrapper(this.queries.type)
    ) {
      transactionHashList = await this.getTransactionByLockAndTypeIndependent(
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    } else {
      //query by ScriptWrapper.script,block_range,order
      transactionHashList = await this.indexer.getTransactions(
        generateSearchKey(this.queries),
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    }

    //filter by queryOptions.skip
    if (skip) {
      transactionHashList.objects = transactionHashList.objects.slice(skip);
    }
    // filter by ScriptWrapper.io_type
    transactionHashList.objects = this.filterByTypeIoTypeAndLockIoType(
      transactionHashList.objects,
      this.queries
    );
    // return if transaction hash list if empty
    if (transactionHashList.objects.length === 0) {
      return {
        objects: [],
        lastCursor: lastCursor,
      };
    }

    let transactionList: TransactionWithIOType[] = await this.getTransactionListFromRpc(
      transactionHashList
    );

    transactionList.forEach(async (transactionWrapper) => {
      if (transactionWrapper.ioType === "input") {
        const targetOutPoint: OutPoint =
          transactionWrapper.transaction.inputs[
            parseInt(transactionWrapper.ioIndex)
          ].previous_output;
        const targetCell = await this.getCellByOutPoint(targetOutPoint);
        transactionWrapper.inputCell = targetCell;
      }
    });

    //filter by ScriptWrapper.argsLen
    transactionList = transactionList.filter(
      (transactionWrapper: TransactionWithIOType) => {
        if (
          transactionWrapper.ioType === "input" &&
          transactionWrapper.inputCell
        ) {
          return this.isCellScriptArgsValidate(transactionWrapper.inputCell);
        } else {
          const targetCell: Output =
            transactionWrapper.transaction.outputs[
              parseInt(transactionWrapper.ioIndex)
            ];
          return this.isCellScriptArgsValidate(targetCell);
        }
      }
    );
    const objects = transactionList.map((tx) => ({
      transaction: tx.transaction,
      tx_status: tx.tx_status,
    }));
    return {
      objects: objects,
      lastCursor: lastCursor,
    };
  }

  private async getTransactionByLockAndTypeIndependent(
    searchKeyFilter: SearchKeyFilter
  ): Promise<GetTransactionsResults> {
    const queryWithTypeAdditionOptions = { ...searchKeyFilter };
    const queryWithLockAdditionOptions = { ...searchKeyFilter };
    if (searchKeyFilter.lastCursor) {
      const [lockLastCursor, typeLastCursor] = searchKeyFilter.lastCursor.split(
        "-"
      );
      queryWithLockAdditionOptions.lastCursor = lockLastCursor;
      queryWithTypeAdditionOptions.lastCursor = typeLastCursor;
    }
    const queriesWithoutType = { ...this.queries, type: undefined };
    const transactionByLock = await this.indexer.getTransactions(
      generateSearchKey(queriesWithoutType),
      queryWithTypeAdditionOptions
    );
    const queriesWithoutLock = { ...this.queries, lock: undefined };
    const transactionByType = await this.indexer.getTransactions(
      generateSearchKey(queriesWithoutLock),
      queryWithLockAdditionOptions
    );
    let hashList = intersectionBy(
      transactionByLock.objects,
      transactionByType.objects,
      "tx_hash"
    );
    // io_type change to both if lock.ioType !== type.ioType
    if (
      instanceOfScriptWrapper(this.queries.lock) &&
      instanceOfScriptWrapper(this.queries.type) &&
      this.queries.lock.ioType !== this.queries.type.ioType
    ) {
      hashList = hashList.map((hashItem) => {
        return { ...hashItem, io_type: "both" as IOType };
      });
    }
    const lastCursor =
      transactionByLock.lastCursor + "-" + transactionByType.lastCursor;
    const objects = hashList;
    return { objects, lastCursor };
  }

  private getTransactionListFromRpc = async (
    transactionHashList: GetTransactionsResults
  ) => {
    const getDetailRequestData = transactionHashList.objects.map(
      (hashItem: GetTransactionsResult, index: number) => {
        return {
          id: index,
          jsonrpc: "2.0",
          method: "get_transaction",
          params: [hashItem.tx_hash],
        };
      }
    );
    const transactionList: TransactionWithIOType[] = await requestBatch(
      this.CKBRpcUrl,
      getDetailRequestData
    ).then((response: GetTransactionRPCResult[]) => {
      return response.map(
        (item: GetTransactionRPCResult): TransactionWithIOType => {
          if (!this.filterOptions.skipMissing && !item.result) {
            throw new Error(
              `Transaction ${
                transactionHashList.objects[item.id].tx_hash
              } is missing!`
            );
          }
          const ioType = transactionHashList.objects[item.id].io_type;
          const ioIndex = transactionHashList.objects[item.id].io_index;
          return { ioType, ioIndex, ...item.result };
        }
      );
    });
    return transactionList;
  };

  private getCellByOutPoint = async (output: OutPoint) => {
    const transaction: Transaction = await request(
      this.CKBRpcUrl,
      "get_transaction",
      [output.tx_hash]
    );
    return transaction.outputs[parseInt(output.index)];
  };

  private isCellScriptArgsValidate = (targetCell: Output) => {
    if (this.queries.lock) {
      let lockArgsLen = instanceOfScriptWrapper(this.queries.lock)
        ? this.queries.lock.argsLen
        : this.queries.argsLen;
      if (
        lockArgsLen &&
        lockArgsLen !== -1 &&
        lockArgsLen !== "any" &&
        getHexStringBytes(targetCell.lock.args) !== lockArgsLen
      ) {
        return false;
      }
    }

    if (this.queries.type && this.queries.type !== "empty") {
      let typeArgsLen = instanceOfScriptWrapper(this.queries.type)
        ? this.queries.type.argsLen
        : this.queries.argsLen;
      if (
        typeArgsLen &&
        typeArgsLen !== -1 &&
        typeArgsLen !== "any" &&
        targetCell.type &&
        getHexStringBytes(targetCell.type.args) !== typeArgsLen
      ) {
        return false;
      }
    }

    if (this.queries.type && this.queries.type === "empty") {
      if (targetCell.type) {
        return false;
      }
    }

    return true;
  };

  private filterByIoType = (
    inputResult: GetTransactionsResult[],
    ioType: IOType
  ) => {
    if (ioType === "both") {
      return inputResult;
    }
    if (ioType === "input" || ioType === "output") {
      return inputResult.filter(
        (item: GetTransactionsResult) =>
          item.io_type === ioType || item.io_type === "both"
      );
    }
    return inputResult;
  };

  private filterByTypeIoTypeAndLockIoType = (
    inputResult: GetTransactionsResult[],
    queries: CkbQueryOptions
  ) => {
    let result = inputResult;
    if (instanceOfScriptWrapper(queries.lock) && queries.lock.ioType) {
      result = this.filterByIoType(result, queries.lock.ioType);
    }
    if (instanceOfScriptWrapper(queries.type) && queries.type.ioType) {
      result = this.filterByIoType(result, queries.type.ioType);
    }
    return result;
  };

  async count(): Promise<number> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (
      skip: number = 0
    ): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      counter += 1;
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
    return counter;
  }
  async getTransactionHashes(): Promise<string[]> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (
      skip: number = 0
    ): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };

    let transactionHashes: string[] = [];
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return [];
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (txs[index].transaction.hash) {
        transactionHashes.push(txs[index].transaction.hash as string);
      }
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
    return transactionHashes;
  }
  async *collect() {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (
      skip: number = 0
    ): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (this.filterOptions.includeStatus) {
        yield txs[index];
      } else {
        yield txs[index].transaction;
      }
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
  }
}
