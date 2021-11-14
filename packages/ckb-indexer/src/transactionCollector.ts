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
  AdditionalOptions,
  CkbQueryOptions,
  GetTransactionsResult,
  GetTransactionsResults,
  IOType,
  Order,
} from "./indexer";

import { CkbIndexer } from "./indexer";
import {
  generatorSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
  requestBatch,
  request,
} from "./services";

interface getTransactionDetailResult {
  objects: TransactionWithStatus[];
  lastCursor: string | undefined;
}

interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: TransactionWithStatus;
}

interface TransactionWithIO extends TransactionWithStatus {
  ioType: IOType;
  ioIndex: string;
}

interface cellFilterResult {
  typeArgsLen?: boolean;
  lockArgsLen?: boolean;
  isTypeScriptEmpty?: boolean;
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
  ): Promise<getTransactionDetailResult> {
    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      additionalOptions.lastCursor = lastCursor;
    }
    /*
     * if both lock and type exist,we need search them in independent and then get intersection
     * cause ckb-indexer use searchKey lock on each cell but native indexer use lock and type on transaction,
     * and one transaction may have many cells both in input and output, more detail in test 'Test query transaction by both input lock and output type script'
     */
    let transactionHashList: GetTransactionsResults = {
      objects: [],
      lastCursor: "",
    };
    if (
      instanceOfScriptWrapper(this.queries.lock) &&
      instanceOfScriptWrapper(this.queries.type)
    ) {
      const queryWithTypeAdditionOptions = { ...additionalOptions };
      const queryWithLockAdditionOptions = { ...additionalOptions };
      if (additionalOptions.lastCursor) {
        queryWithLockAdditionOptions.lastCursor = additionalOptions.lastCursor.split(
          "-"
        )[0];
        queryWithTypeAdditionOptions.lastCursor = additionalOptions.lastCursor.split(
          "-"
        )[1];
      }
      const queriesWithoutType = { ...this.queries, type: undefined };
      const transactionByLock = await this.indexer.getTransactions(
        generatorSearchKey(queriesWithoutType),
        queryWithTypeAdditionOptions
      );
      const queriesWithoutLock = { ...this.queries, lock: undefined };
      const transactionByType = await this.indexer.getTransactions(
        generatorSearchKey(queriesWithoutLock),
        queryWithLockAdditionOptions
      );
      let hashList = intersectionBy(
        transactionByLock.objects,
        transactionByType.objects,
        "tx_hash"
      );
      if (this.queries.lock.ioType !== this.queries.type.ioType) {
        hashList = hashList.map((hashItem) => {
          return { ...hashItem, io_type: "both" as IOType };
        });
      }
      lastCursor =
        transactionByLock.lastCursor + "-" + transactionByType.lastCursor;
      transactionHashList.objects = hashList;
    } else {
      //query by ScriptWrapper.script,block_range,order
      transactionHashList = await this.indexer.getTransactions(
        generatorSearchKey(this.queries),
        additionalOptions
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
    if (transactionHashList.objects.length === 0) {
      return {
        objects: [],
        lastCursor: lastCursor,
      };
    }

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
    let transactionList: TransactionWithIO[] = await requestBatch(
      this.CKBRpcUrl,
      getDetailRequestData
    ).then((response: GetTransactionRPCResult[]) => {
      return response.map(
        (item: GetTransactionRPCResult): TransactionWithIO => {
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
    //filter by ScriptWrapper.argsLen
    transactionList = transactionList.filter(
      async (transactionWrapper: TransactionWithIO) => {
        if (transactionWrapper.ioType === "output") {
          const targetCell: Output =
            transactionWrapper.transaction.outputs[
              parseInt(transactionWrapper.ioIndex)
            ];
          return this.isCellScriptArgsValidate(targetCell);
        } else {
          const targetOutPoint: OutPoint =
            transactionWrapper.transaction.inputs[
              parseInt(transactionWrapper.ioIndex)
            ].previous_output;
          const targetCell = await this.getCellByOutpoint(targetOutPoint);
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

  private getCellByOutpoint = async (output: OutPoint) => {
    const transaction: Transaction = await request(
      this.CKBRpcUrl,
      "get_transaction",
      [output.tx_hash]
    );
    return transaction.outputs[parseInt(output.index)];
  };

  private isCellScriptArgsValidate = (targetCell: Output) => {
    let lockArgsLen: number | "any" | undefined;
    let typeArgsLen: number | "any" | undefined;
    if (this.queries.lock) {
      lockArgsLen = instanceOfScriptWrapper(this.queries.lock)
        ? this.queries.lock.argsLen
        : this.queries.argsLen;
    }
    if (this.queries.type && this.queries.type !== "empty") {
      typeArgsLen = instanceOfScriptWrapper(this.queries.type)
        ? this.queries.type.argsLen
        : this.queries.argsLen;
    }
    const resultMap: cellFilterResult = {
      lockArgsLen: true,
      typeArgsLen: true,
      isTypeScriptEmpty: true,
    };
    if (this.queries.lock && instanceOfScriptWrapper(this.queries.lock)) {
      resultMap.lockArgsLen = false;
      if (getHexStringBytes(targetCell.lock.args) !== lockArgsLen) {
        resultMap.lockArgsLen = true;
      }
    }
    if (this.queries.type && this.queries.type !== "empty") {
      resultMap.typeArgsLen = false;
      if (
        targetCell.type &&
        getHexStringBytes(targetCell.type.args) !== typeArgsLen
      ) {
        resultMap.typeArgsLen = true;
      }
    }
    if (this.queries.type && this.queries.type === "empty") {
      resultMap.isTypeScriptEmpty = false;
      if (!targetCell.type) {
        resultMap.isTypeScriptEmpty = true;
      }
    }
    return (
      resultMap.lockArgsLen &&
      resultMap.typeArgsLen &&
      resultMap.isTypeScriptEmpty
    );
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
      const result: getTransactionDetailResult = await this.getTransactions(
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
      const result: getTransactionDetailResult = await this.getTransactions(
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
      const result: getTransactionDetailResult = await this.getTransactions(
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
