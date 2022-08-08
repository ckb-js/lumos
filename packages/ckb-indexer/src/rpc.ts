import { HexString, Tip, utils } from "@ckb-lumos/base";
import {
  GetLiveCellsResult,
  IndexerTransactionList,
  Order,
  SearchKey,
} from "./type";
import fetch from "cross-fetch";

export class RPC {
  private uri: string;

  /**
   *
   * @param uri  indexer uri
   */
  constructor(uri: string) {
    this.uri = uri;
  }

  async getTip(): Promise<Tip> {
    return utils.deepCamel(await request(this.uri, "get_tip"));
  }
  async getCells(
    searchKey: SearchKey,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<GetLiveCellsResult> {
    const params = [searchKey, order, limit, cursor];
    return utils.deepCamel(await request(this.uri, "get_cells", params));
  }
  async getTransactions(
    searchKey: SearchKey,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<IndexerTransactionList> {
    const params = [searchKey, order, limit, cursor];
    return utils.deepCamel(await request(this.uri, "get_transactions", params));
  }
  async getIndexerInfo(): Promise<string> {
    return utils.deepCamel(await request(this.uri, "get_indexer_info"));
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
