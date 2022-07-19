// import { HexString, Tip } from "@ckb-lumos/base";
// import {
//   GetCellsResults,
//   IndexerTransactionList,
//   Order,
//   SearchKey,
// } from "./type";

// interface GetCellsCapacityResult {
//   capacity: HexString;
//   block_hash: HexString;
//   block_number: HexString;
// }

// const handler = {
//   get: (target: any, method: string) => {
//     return async (...params: any) => {
//       const result = await target.rpc[method](...params);
//       return result;
//     };
//   },
// };
// class RpcProxy {
//   private rpc: ToolkitRPC;
//   constructor(uri: string) {
//     this.rpc = new ToolkitRPC(uri);
//   }

//   getProxy() {
//     return new Proxy(this, handler);
//   }
// }

// export class RPC {
//   private rpcProxy: any;

//   /**
//    *
//    * @param uri  indexer uri
//    */
//   constructor(uri: string) {
//     this.rpcProxy = new RpcProxy(uri).getProxy();
//   }

//   async get_tip(): Promise<Tip> {
//     return this.rpcProxy.get_tip();
//   }
//   async get_cells(
//     searchKey: SearchKey,
//     order: Order,
//     limit: HexString,
//     after_cursor?: string
//   ): Promise<GetCellsResults> {
//     return this.rpcProxy.get_cells(searchKey, order, limit, after_cursor);
//   }
//   async get_transactions(
//     searchKey: SearchKey,
//     order: Order,
//     limit: HexString,
//     after_cursor?: string
//   ): Promise<IndexerTransactionList> {
//     return this.rpcProxy.get_transactions(
//       searchKey,
//       order,
//       limit,
//       after_cursor
//     );
//   }
//   async get_cells_capacity(
//     searchKey: SearchKey
//   ): Promise<GetCellsCapacityResult> {
//     return this.rpcProxy.get_cells_capacity(searchKey);
//   }
//   async get_indexer_info(): Promise<string> {
//     return this.rpcProxy.get_indexer_info();
//   }
// }
