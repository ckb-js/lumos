import {
  TransactionCollectorResults,
  TransactionCollectorOptions,
  indexer as BaseIndexerModule,
  Transaction,
} from "@ckb-lumos/base";

import { AdditionalOptions, CkbQueryOptions, GetTransactionsResult, GetTransactionsResults, IOType, Order } from "./indexer";

import { CkbIndexer } from "./indexer";
import { generatorSearchKey, instanceOfScriptWrapper, requestBatch} from "./services";

interface getTransactionDetailResult {
  objects: Transaction[],
  lastCursor: string
}

interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: Transaction;
}

export class CKBTransactionCollector extends BaseIndexerModule.TransactionCollector{
  constructor(
    public indexer: CkbIndexer,
    public queries: CkbQueryOptions,
    public CKBRpcUrl: string,
    public options?: TransactionCollectorOptions,
  ) {
      super(indexer, queries, options);
  }
  private async getTransactions(lastCursor?: string): Promise<getTransactionDetailResult> {
    const additionalOptions: AdditionalOptions = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      additionalOptions.lastCursor = lastCursor;
    }

    const result: GetTransactionsResults = await this.indexer.getTransactions(
      generatorSearchKey(this.queries),
      additionalOptions
    );

    lastCursor = result.lastCursor

    result.objects = this.filterResult(result.objects, this.queries);
    if(result.objects.length === 0) {
      return {
        objects: [],
        lastCursor: lastCursor
      }
    }
    const getDetailRequestData = result.objects.map((hashItem: GetTransactionsResult, index: number) => {
      return {
        "id": index,
        "jsonrpc": "2.0",
        "method": "get_transaction",
        "params": [
          hashItem.tx_hash
        ]
      }
    })
    const transactionList:Transaction[] = await requestBatch(this.CKBRpcUrl, getDetailRequestData).then((response: GetTransactionRPCResult[]) => {
      return response.map((item: GetTransactionRPCResult) => item.result);
    })
    return {
      objects: transactionList,
      lastCursor: lastCursor
    };
  }

  private filterIoType = (inputResult: GetTransactionsResult[], ioType: IOType) => {
    if(ioType === 'both') {
      return inputResult
    }
    if(ioType === 'input' || ioType === 'output') {
      return inputResult.filter((item: GetTransactionsResult) => (item.io_type === ioType))
    }
    return inputResult
  }
  private filterResult = (inputResult:GetTransactionsResult[], queries:CkbQueryOptions) => {
    let result = inputResult;
    if(queries.skip) {
      result = inputResult.slice(queries.skip)
    }
    if(instanceOfScriptWrapper(queries.lock) && queries.lock.ioType) {
      result = this.filterIoType(result, queries.lock.ioType)
    }
    return result;
  }

  async count(): Promise<number> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<Transaction[]> => {
      const result: getTransactionDetailResult = await this.getTransactions(lastCursor);
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    let txs: Transaction[] = await getTxWithCursor();
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
  async getTransactionHashes(): Promise<(string)[]> {
    const transactions = await this.getTransactions();
    if(transactions.objects.length === 0) {
      return []
    }
    let transactionHashes: string[] = [];
     transactions.objects.forEach(tx => {
       if(tx.hash) {
         transactionHashes.push(tx.hash)
       }
    })
    return transactionHashes;
  }
  collect(): TransactionCollectorResults {
    throw new Error("Method not implemented.");
  }
}
