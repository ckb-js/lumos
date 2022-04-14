import {
  TransactionCollectorOptions,
  indexer as BaseIndexerModule,
  Output,
  OutPoint,
  TransactionWithStatus,
  TransactionCollector as BaseTransactionCollector,
  QueryOptions,
  Transaction,
} from "@ckb-lumos/base";
import {
  SearchKeyFilter,
  CKBIndexerQueryOptions,
  IndexerTransaction,
  IndexerTransactionList,
  IOType,
  Order,
  GetTransactionRPCResult,
  JsonRprRequestBody,
} from "./type";
import { CkbIndexer } from "./indexer";
import * as services from "./services";

interface GetTransactionDetailResult {
  objects: TransactionWithStatus[];
  lastCursor: string | undefined;
}

export class CKBIndexerTransactionCollector extends BaseIndexerModule.TransactionCollector {
  filterOptions: TransactionCollectorOptions;
  constructor(
    public indexer: CkbIndexer,
    public queries: CKBIndexerQueryOptions,
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

  public static asBaseTransactionCollector(
    CKBRpcUrl: string
  ): typeof BaseTransactionCollector {
    return class extends BaseIndexerModule.TransactionCollector {
      constructor(
        indexer: CkbIndexer,
        queries: QueryOptions,
        options?: TransactionCollectorOptions
      ) {
        super(indexer, queries, options);
        return new CKBIndexerTransactionCollector(
          indexer,
          queries,
          CKBRpcUrl,
          options
        );
      }
    };
  }
  public async fetchIndexerTransaction(
    queries: CKBIndexerQueryOptions,
    lastCursor?: string
  ): Promise<IndexerTransactionList> {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: queries.bufferSize,
      order: queries.order as Order,
    };
    if (lastCursor) {
      searchKeyFilter.lastCursor = lastCursor;
    }
    let indexerTransactionList: IndexerTransactionList = {
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
      services.instanceOfScriptWrapper(queries.lock) &&
      services.instanceOfScriptWrapper(queries.type)
    ) {
      indexerTransactionList = await this.getTransactionByLockAndTypeIndependent(
        searchKeyFilter
      );
      lastCursor = indexerTransactionList.lastCursor;
    } else {
      //query by ScriptWrapper.script,block_range,order
      indexerTransactionList = await this.indexer.getTransactions(
        services.generateSearchKey(queries),
        searchKeyFilter
      );
      lastCursor = indexerTransactionList.lastCursor;
    }
    // filter by ScriptWrapper.io_type
    indexerTransactionList.objects = this.filterByTypeIoTypeAndLockIoType(
      indexerTransactionList.objects,
      queries
    );
    return indexerTransactionList;
  }

  public getResolvedTransactionRequestPayload(
    unresolvedTransactionList: TransactionWithStatus[],
    indexerTransactionList: IndexerTransactionList
  ): JsonRprRequestBody[] {
    const requestPayload: JsonRprRequestBody[] = [];
    let resolvedTransactionRequestId = 0;
    unresolvedTransactionList.forEach(
      (unresolvedTransaction: TransactionWithStatus, index: number) => {
        const indexerTransaction = indexerTransactionList.objects[index];
        if (indexerTransaction.io_type === "input") {
          const unresolvedOutPoint: OutPoint =
            unresolvedTransaction.transaction.inputs[
              Number(indexerTransaction.io_index)
            ].previous_output;
          requestPayload.push({
            id: resolvedTransactionRequestId++,
            jsonrpc: "2.0",
            method: "get_transaction",
            params: [unresolvedOutPoint.tx_hash],
          });
        }
      }
    );
    return requestPayload;
  }

  public async fetchResolvedTransaction(
    txIoTypeInputOutPointList: JsonRprRequestBody[]
  ): Promise<GetTransactionRPCResult[]> {
    let resolvedTransaction: GetTransactionRPCResult[] = [];
    if (txIoTypeInputOutPointList.length <= 0) {
      return resolvedTransaction;
    }
    resolvedTransaction = await services.requestBatch(
      this.CKBRpcUrl,
      txIoTypeInputOutPointList
    );
    return resolvedTransaction;
  }

  public getResolvedCell(
    unresolvedTransaction: TransactionWithStatus,
    resolvedTransactionList: GetTransactionRPCResult[],
    indexerTransaction: IndexerTransaction
  ): Output {
    if (indexerTransaction.io_type !== "input") {
      return unresolvedTransaction.transaction.outputs[
        Number(indexerTransaction.io_index)
      ];
    } else {
      const unresolvedOutPoint =
        unresolvedTransaction.transaction.inputs[
          Number(indexerTransaction.io_index)
        ].previous_output;
      const resolvedTransaction = resolvedTransactionList.find((tx) => {
        return tx.result.transaction.hash === unresolvedOutPoint.tx_hash;
      });
      if (!resolvedTransaction) {
        throw new Error(`Impossible: can NOT find resolved transaction!`);
      }
      const resolvedCell =
        resolvedTransaction.result.transaction.outputs[
          Number(unresolvedOutPoint.index)
        ];
      return resolvedCell;
    }
  }

  //filter by ScriptWrapper.argsLen
  public filterTransaction(
    unresolvedTransactionList: TransactionWithStatus[],
    resolvedTransactionList: GetTransactionRPCResult[],
    indexerTransactionList: IndexerTransactionList
  ): TransactionWithStatus[] {
    const filteredTransactionList = unresolvedTransactionList.filter(
      (unresolvedTransaction: TransactionWithStatus, index: number) => {
        const resolvedCell: Output = this.getResolvedCell(
          unresolvedTransaction,
          resolvedTransactionList,
          indexerTransactionList.objects[index]
        );
        return this.isCellScriptArgsValid(resolvedCell);
      }
    );
    const objects = filteredTransactionList.map((tx) => ({
      transaction: tx.transaction,
      tx_status: tx.tx_status,
    }));
    return objects;
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
  public async getTransactions(
    lastCursor?: string
  ): Promise<GetTransactionDetailResult> {
    const indexerTransactionList: IndexerTransactionList = await this.fetchIndexerTransaction(
      this.queries,
      lastCursor
    );
    lastCursor = indexerTransactionList.lastCursor;

    // return if transaction hash list if empty
    if (indexerTransactionList.objects.length === 0) {
      return {
        objects: [],
        lastCursor: lastCursor,
      };
    }
    const unresolvedTransactionList: TransactionWithStatus[] = await this.getTransactionListFromRpc(
      indexerTransactionList
    );

    const requestPayload = this.getResolvedTransactionRequestPayload(
      unresolvedTransactionList,
      indexerTransactionList
    );
    const resolvedTransactionList = await this.fetchResolvedTransaction(
      requestPayload
    );
    const objects = this.filterTransaction(
      unresolvedTransactionList,
      resolvedTransactionList,
      indexerTransactionList
    );
    return {
      objects: objects,
      lastCursor: lastCursor,
    };
  }

  private async getTransactionByLockAndTypeIndependent(
    searchKeyFilter: SearchKeyFilter
  ): Promise<IndexerTransactionList> {
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
      services.generateSearchKey(queriesWithoutType),
      queryWithTypeAdditionOptions
    );
    const queriesWithoutLock = { ...this.queries, lock: undefined };
    const transactionByType = await this.indexer.getTransactions(
      services.generateSearchKey(queriesWithoutLock),
      queryWithLockAdditionOptions
    );

    const intersection = (
      transactionList1: IndexerTransaction[],
      transactionList2: IndexerTransaction[]
    ) => {
      const result: IndexerTransaction[] = [];
      transactionList1.forEach((tx1) => {
        const tx2 = transactionList2.find(
          (item) => item.tx_hash === tx1.tx_hash
        );
        if (tx2) {
          // put the output io_type to intersection result, cause output have cells
          const targetTx = tx1.io_type === "output" ? tx1 : tx2;
          // change io_type to both cause targetTx exist both input and output
          result.push({ ...targetTx, io_type: "both" });
        }
      });
      return result;
    };
    const hashList = intersection(
      transactionByType.objects,
      transactionByLock.objects
    );
    const lastCursor =
      transactionByLock.lastCursor + "-" + transactionByType.lastCursor;
    const objects = hashList;
    return { objects, lastCursor };
  }

  private getTransactionListFromRpc = async (
    indexerTransactionList: IndexerTransactionList
  ) => {
    const getDetailRequestData = indexerTransactionList.objects.map(
      (hashItem: IndexerTransaction, index: number) => {
        return {
          id: index,
          jsonrpc: "2.0",
          method: "get_transaction",
          params: [hashItem.tx_hash],
        };
      }
    );
    const transactionList: TransactionWithStatus[] = await services
      .requestBatch(this.CKBRpcUrl, getDetailRequestData)
      .then((response: GetTransactionRPCResult[]) => {
        return response.map(
          (item: GetTransactionRPCResult): TransactionWithStatus => {
            if (!this.filterOptions.skipMissing && !item.result) {
              throw new Error(
                `Transaction ${
                  indexerTransactionList.objects[item.id].tx_hash
                } is missing!`
              );
            }
            return { ...item.result };
          }
        );
      });
    return transactionList;
  };

  private isLockArgsLenMatched = (
    args: string | undefined,
    argsLen?: number | "any"
  ) => {
    if (!argsLen) return true;
    if (argsLen === "any") return true;
    if (argsLen === -1) return true;
    return services.getHexStringBytes(args as string) === argsLen;
  };

  // only valid after pass flow three validate
  private isCellScriptArgsValid = (targetCell: Output) => {
    if (this.queries.lock) {
      const lockArgsLen = services.instanceOfScriptWrapper(this.queries.lock)
        ? this.queries.lock.argsLen
        : this.queries.argsLen;
      if (!this.isLockArgsLenMatched(targetCell.lock.args, lockArgsLen)) {
        return false;
      }
    }

    if (this.queries.type && this.queries.type !== "empty") {
      const typeArgsLen = services.instanceOfScriptWrapper(this.queries.type)
        ? this.queries.type.argsLen
        : this.queries.argsLen;
      if (!this.isLockArgsLenMatched(targetCell.type?.args, typeArgsLen)) {
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
    inputResult: IndexerTransaction[],
    ioType: IOType
  ) => {
    if (ioType === "both") {
      return inputResult;
    }
    if (ioType === "input" || ioType === "output") {
      return inputResult.filter(
        (item: IndexerTransaction) =>
          item.io_type === ioType || item.io_type === "both"
      );
    }
    return inputResult;
  };

  private filterByTypeIoTypeAndLockIoType = (
    inputResult: IndexerTransaction[],
    queries: CKBIndexerQueryOptions
  ) => {
    let result = inputResult;
    if (services.instanceOfScriptWrapper(queries.lock) && queries.lock.ioType) {
      result = this.filterByIoType(result, queries.lock.ioType);
    }
    if (services.instanceOfScriptWrapper(queries.type) && queries.type.ioType) {
      result = this.filterByIoType(result, queries.type.ioType);
    }
    return result;
  };

  async count(): Promise<number> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    let txs: TransactionWithStatus[] = await getTxWithCursor();
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index = 0;
    let skippedCount = 0;
    while (true) {
      if (this.queries.skip && skippedCount < this.queries.skip) {
        skippedCount++;
      } else {
        counter += 1;
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
    return counter;
  }
  async getTransactionHashes(): Promise<string[]> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };

    const transactionHashes: string[] = [];
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor();
    if (txs.length === 0) {
      return [];
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index = 0;
    let skippedCount = 0;
    while (true) {
      if (this.queries.skip && skippedCount < this.queries.skip) {
        skippedCount++;
      } else {
        if (txs[index].transaction.hash) {
          transactionHashes.push(txs[index].transaction.hash as string);
        }
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
  async *collect(): AsyncGenerator<
    TransactionWithStatus | Transaction,
    undefined,
    unknown
  > {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor();
    if (txs.length === 0) {
      return undefined;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index = 0;
    let skippedCount = 0;
    while (true) {
      if (this.queries.skip && skippedCount < this.queries.skip) {
        skippedCount++;
      } else {
        if (this.filterOptions.includeStatus) {
          yield txs[index];
        } else {
          yield txs[index].transaction;
        }
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
