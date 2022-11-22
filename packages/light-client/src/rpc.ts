import { HexString, utils, Header, Block } from "@ckb-lumos/base";
import { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";
import { ParamsFormatter } from "@ckb-lumos/rpc";

import {
  GetLiveCellsResult,
  IndexerTransactionList,
  Order,
  SearchKey,
  GetCellsSearchKey,
  GetTransactionsSearchKey,
} from "@ckb-lumos/ckb-indexer/lib/type";
import {
  toScript,
  toSearchKey,
  toGetCellsSearchKey,
  toGetTransactionsSearchKey,
} from "@ckb-lumos/ckb-indexer/lib/paramsFormatter";
import {
  FetchHeaderResult,
  FetchTransactionResult,
  LightClientScript,
  TransactionWithHeader,
} from "./type";
import fetch from "cross-fetch";

/* c8 ignore next 100 */
export class LightClientRPC {
  /**
   *
   * @param uri light client uri
   */
  constructor(private uri: string) {}

  async getTipHeader(): Promise<Header> {
    return utils.deepCamel(await request(this.uri, "get_tip_header"));
  }

  async fetchHeader(blockHash: string): Promise<FetchHeaderResult> {
    const params = [blockHash];
    return utils.deepCamel(await request(this.uri, "fetch_header", params));
  }

  async getHeader(blockHash: string): Promise<Header> {
    const params = [blockHash];
    return utils.deepCamel(await request(this.uri, "get_header", params));
  }

  async fetchTransaction(txHash: string): Promise<FetchTransactionResult> {
    const params = [txHash];
    return utils.deepCamel(
      await request(this.uri, "fetch_transaction", params)
    );
  }

  async getTransaction(txHash: string): Promise<TransactionWithHeader> {
    const params = [txHash];
    return utils.deepCamel(await request(this.uri, "get_transaction", params));
  }

  async sendTransaction(
    tx: CKBComponents.RawTransaction
  ): Promise<CKBComponents.Hash> {
    const params = [ParamsFormatter.toRawTransaction(tx)];
    return utils.deepCamel(await request(this.uri, "send_transaction", params));
  }

  async getScripts(): Promise<Array<LightClientScript>> {
    return utils.deepCamel(await request(this.uri, "get_scripts"));
  }

  async setScripts(scripts: Array<LightClientScript>): Promise<void> {
    const params = [
      scripts.map(({ script, scriptType, blockNumber }) => ({
        script: toScript(script),
        script_type: scriptType,
        block_number: blockNumber,
      })),
    ];
    return utils.deepCamel(await request(this.uri, "set_scripts", params));
  }

  async getCells<WithData extends boolean = true>(
    searchKey: GetCellsSearchKey<WithData>,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<GetLiveCellsResult<WithData>> {
    const params = [toGetCellsSearchKey(searchKey), order, limit, cursor];
    return utils.deepCamel(await request(this.uri, "get_cells", params));
  }

  async getCellsCapacity(
    searchKey: SearchKey
  ): Promise<CKBComponents.CellsCapacity> {
    const params = [toSearchKey(searchKey)];
    return utils.deepCamel(
      await request(this.uri, "get_cells_capacity", params)
    );
  }

  async getGenesisBlock(): Promise<Block> {
    return utils.deepCamel(await request(this.uri, "get_genesis_block"));
  }

  async getTransactions<Grouped extends boolean = false>(
    searchKey: GetTransactionsSearchKey<Grouped>,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<IndexerTransactionList<Grouped>> {
    const params = [
      toGetTransactionsSearchKey(searchKey),
      order,
      limit,
      cursor,
    ];
    return utils.deepCamel(await request(this.uri, "get_transactions", params));
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
const request = async (
  ckbIndexerUrl: string,
  method: string,
  params?: any
): Promise<any> => {
  const res = await fetch(ckbIndexerUrl, {
    method: "POST",
    body: JSON.stringify({
      id: 0,
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`);
  }
  const data = await res.json();
  if (data.error !== undefined) {
    throw new Error(
      `indexer request rpc failed with error: ${JSON.stringify(data.error)}`
    );
  }
  return data.result;
};
/* eslint-enalbe @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
