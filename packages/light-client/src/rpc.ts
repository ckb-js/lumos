import { CKBComponents } from "@ckb-lumos/rpc/types/api";
import { RPC } from "@ckb-lumos/rpc/types/rpc";
import { ParamsFormatter, ResultFormatter } from "@ckb-lumos/rpc";
import type {
  FetchHeaderResult,
  FetchTransactionResult,
  LightClientScript,
  SetScriptCommand,
  LightClientRPC as LightClientRPCType,
} from "./type";
import {
  toFetchHeaderResult,
  toFetchTransactionResult,
  toLightClientScript,
} from "./resultFormatter";
import fetch from "cross-fetch";

/* c8 ignore next 100 */
export class LightClientRPC {
  /**
   *
   * @param uri light client uri
   */
  constructor(private uri: string) {}

  async getTipHeader(): Promise<CKBComponents.BlockHeader> {
    return ResultFormatter.toHeader(await request(this.uri, "get_tip_header"));
  }

  async getPeers(): Promise<Array<CKBComponents.RemoteNodeInfo>> {
    return ResultFormatter.toPeers(await request(this.uri, "get_peers"));
  }

  async localNodeInfo(): Promise<CKBComponents.LocalNodeInfo> {
    return ResultFormatter.toLocalNodeInfo(
      await request(this.uri, "local_node_info")
    );
  }

  async fetchHeader(blockHash: string): Promise<FetchHeaderResult> {
    const params = [blockHash];
    return toFetchHeaderResult(await request(this.uri, "fetch_header", params));
  }

  async getHeader(blockHash: string): Promise<CKBComponents.BlockHeader> {
    const params = [blockHash];
    return ResultFormatter.toHeader(
      await request(this.uri, "get_header", params)
    );
  }

  async fetchTransaction(txHash: string): Promise<FetchTransactionResult> {
    const params = [txHash];
    return toFetchTransactionResult(
      await request(this.uri, "fetch_transaction", params)
    );
  }

  async getTransaction(
    txHash: string
  ): Promise<CKBComponents.TransactionWithStatus> {
    const params = [txHash];
    return ResultFormatter.toTransactionWithStatus(
      await request(this.uri, "get_transaction", params)
    );
  }

  async sendTransaction(
    tx: CKBComponents.RawTransaction
  ): Promise<CKBComponents.Hash> {
    const params = [ParamsFormatter.toRawTransaction(tx)];
    return ResultFormatter.toHash(
      await request(this.uri, "send_transaction", params)
    );
  }

  async getScripts(): Promise<Array<LightClientScript>> {
    return (
      await request<[], LightClientRPCType.LightClientScript[]>(
        this.uri,
        "get_scripts"
      )
    ).map(toLightClientScript);
  }

  async setScripts(
    scripts: Array<LightClientScript>,
    command?: SetScriptCommand
  ): Promise<void> {
    const params = [
      scripts.map(({ script, scriptType, blockNumber }) => ({
        script: ParamsFormatter.toScript(script),
        script_type: scriptType,
        block_number: blockNumber,
      })),
      command,
    ];
    await request(this.uri, "set_scripts", params);
  }

  async getCells<WithData extends boolean = true>(
    searchKey: CKBComponents.GetCellsSearchKey<WithData>,
    order: CKBComponents.Order,
    limit: CKBComponents.UInt32,
    cursor?: string
  ): Promise<CKBComponents.GetLiveCellsResult<WithData>> {
    const params = [
      ParamsFormatter.toGetCellsSearchKey(searchKey),
      order,
      limit,
      cursor,
    ];
    return ResultFormatter.toGetCellsResult<WithData>(
      await request(this.uri, "get_cells", params)
    );
  }

  async getCellsCapacity(
    searchKey: CKBComponents.SearchKey
  ): Promise<CKBComponents.CellsCapacity> {
    const params = [ParamsFormatter.toSearchKey(searchKey)];
    return ResultFormatter.toCellsCapacity(
      await request(this.uri, "get_cells_capacity", params)
    );
  }

  async getGenesisBlock(): Promise<CKBComponents.Block> {
    return ResultFormatter.toBlock(
      await request<[], RPC.Block>(this.uri, "get_genesis_block")
    );
  }

  async getTransactions<Grouped extends boolean = false>(
    searchKey: CKBComponents.GetTransactionsSearchKey<Grouped>,
    order: CKBComponents.Order,
    limit: CKBComponents.UInt32,
    cursor?: string
  ): Promise<CKBComponents.GetTransactionsResult<Grouped>> {
    const params = [
      ParamsFormatter.toGetTransactionsSearchKey(searchKey),
      order,
      limit,
      cursor,
    ];
    return ResultFormatter.toGetTransactionsResult(
      await request(this.uri, "get_transactions", params)
    );
  }
}

const request = async <P, R>(
  ckbIndexerUrl: string,
  method: string,
  params?: P
): Promise<R> => {
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
