import { HexString, utils, Header } from "@ckb-lumos/base";
import {
  GetLiveCellsResult,
  IndexerTransactionList,
  Order,
  GetCellsSearchKey,
  GetTransactionsSearchKey,
} from "@ckb-lumos/ckb-indexer/lib/type";
import {
  toScript,
  toGetCellsSearchKey,
  toGetTransactionsSearchKey,
} from "@ckb-lumos/ckb-indexer/lib/paramsFormatter";
import {
  FetchHeaderResult,
  FetchTransactionResult,
  LightClientScript,
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

  async removeHeaders(blockHashes?: string[]): Promise<string[]> {
    const params = [blockHashes];
    return utils.deepCamel(await request(this.uri, "remove_headers", params));
  }

  async fetchTransaction(txHash: string): Promise<FetchTransactionResult> {
    const params = [txHash];
    return utils.deepCamel(
      await request(this.uri, "fetch_transaction", params)
    );
  }

  async removeTransactions(txHashes?: string[]): Promise<string[]> {
    const params = [txHashes];
    return utils.deepCamel(
      await request(this.uri, "remove_transactions", params)
    );
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
