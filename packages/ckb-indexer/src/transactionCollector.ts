import {
  TransactionCollectorOptions,
  indexer as BaseIndexerModule,
  Transaction,
  Output,
  OutPoint,
} from "@ckb-lumos/base";

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
  objects: Transaction[];
  lastCursor: string;
}

interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: Transaction;
}

interface TransactionWithIO extends Transaction {
  ioType: IOType;
  ioIndex: string;
}

interface cellFilterResult {
  typeArgsLen?: boolean;
  lockArgsLen?: boolean;
  isTypeScriptEmpty?: boolean;
}

//TODO work with TransactionCollectorOptions.skipMissing and TransactionCollectorOptions.includeStatus
export class CKBTransactionCollector extends BaseIndexerModule.TransactionCollector {
  constructor(
    public indexer: CkbIndexer,
    public queries: CkbQueryOptions,
    public CKBRpcUrl: string,
    public options?: TransactionCollectorOptions
  ) {
    super(indexer, queries, options);
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
    const defaultOptions:TransactionCollectorOptions = {
      skipMissing: false,
      includeStatus: true
    }
    const options = {...defaultOptions, ...this.options}
    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      additionalOptions.lastCursor = lastCursor;
    }

    //query by ScriptWrapper.script,block_range,order
    const transactionHashList: GetTransactionsResults = await this.indexer.getTransactions(
      generatorSearchKey(this.queries),
      additionalOptions
    );
    lastCursor = transactionHashList.lastCursor;

    //filter by queryOptions.skip
    if (skip) {
      transactionHashList.objects = transactionHashList.objects.slice(skip);
    }

    //filter by ScriptWrapper.io_type
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
          if(!options.skipMissing && !item.result) {
            throw new Error(`Transaction ${transactionHashList.objects[item.id].tx_hash} is missing!`);
          }
          const ioType = transactionHashList.objects[item.id].io_type;
          const ioIndex = transactionHashList.objects[item.id].io_index;
          return { ioType, ioIndex, ...item.result };
        }
      );
    });
    //filter by ScriptWrapper.argsLen
    transactionList = transactionList.filter(
      async (transaction: TransactionWithIO) => {
        if (transaction.ioType === "output") {
          const targetCell: Output =
            transaction.outputs[parseInt(transaction.ioIndex)];
          return this.isCellScriptArgsValidate(targetCell);
        } else {
          const targetOutPoint: OutPoint =
            transaction.inputs[parseInt(transaction.ioIndex)].previous_output;
          const targetCell = await this.getCellByOutpoint(targetOutPoint);
          return this.isCellScriptArgsValidate(targetCell);
        }
      }
    );
    return {
      objects: transactionList,
      lastCursor: lastCursor,
    };
  }

  private getCellByOutpoint = async (output: OutPoint) => {
    const transaction: Transaction = await request(
      this.CKBRpcUrl,
      "get_transaction",
      output.tx_hash
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

  //TODO 确认ScriptWrapper.ioType和transaction.io_type的关系
  private filterByIoType = (
    inputResult: GetTransactionsResult[],
    ioType: IOType
  ) => {
    if (ioType === "both") {
      return inputResult;
    }
    if (ioType === "input" || ioType === "output") {
      return inputResult.filter(
        (item: GetTransactionsResult) => item.io_type === ioType
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
    ): Promise<Transaction[]> => {
      const result: getTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    //skip query result in first query
    let txs: Transaction[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<Transaction[]> = getTxWithCursor();
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
    ): Promise<Transaction[]> => {
      const result: getTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };

    let transactionHashes: string[] = [];
    //skip query result in first query
    let txs: Transaction[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return [];
    }
    let buffer: Promise<Transaction[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (txs[index].hash) {
        transactionHashes.push(txs[index].hash as string);
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
    ): Promise<Transaction[]> => {
      const result: getTransactionDetailResult = await this.getTransactions(
        lastCursor,
        skip
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    //skip query result in first query
    let txs: Transaction[] = await getTxWithCursor(this.queries.skip);
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<Transaction[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      yield txs[index];
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
