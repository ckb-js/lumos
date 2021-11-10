import {
  TransactionCollectorResults,
  TransactionCollectorOptions,
  indexer as BaseIndexerModule
} from "@ckb-lumos/base";

import { AdditionalOptions, CkbQueryOptions, GetTransactionsResult, GetTransactionsResults, IOType, Order } from "./indexer";

import { CkbIndexer } from "./indexer";
import { generatorSearchKey, instanceOfScriptWrapper} from "./services";
 
export class CKBTransactionCollector extends BaseIndexerModule.TransactionCollector{
  constructor(
    public indexer: CkbIndexer,
    public queries: CkbQueryOptions,
    public options?: TransactionCollectorOptions
  ) {
      super(indexer, queries, options);
  }
  private async getTransactions(lastCursor?: string): Promise<GetTransactionsResults> {
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

    result.objects = this.filterResult(result.objects, this.queries);
    return result;
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
  private shouldSkipped() {
    return false;
  }

  async count(): Promise<number> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<GetTransactionsResult[]> => {
      const result: GetTransactionsResults = await this.getTransactions(lastCursor);
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    let txs: GetTransactionsResult[] = await getTxWithCursor();
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<GetTransactionsResult[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (!this.shouldSkipped()) {
        counter += 1;
      }
      index++;
      //reset index and exchange `txs` and `buffer` after count last cell
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
    const transactions = await this.getTransactions();
    const transactionHashes = transactions.objects.map(tx => {
      return tx.tx_hash
    })
    return transactionHashes;
  }
  collect(): TransactionCollectorResults {
    throw new Error("Method not implemented.");
  }
}
