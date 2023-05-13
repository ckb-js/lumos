import { RPC } from "@ckb-lumos/rpc";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionManager } from "./TransactionManager";
import { Store } from "./store";

/**
 * The easy way to create a `TransactionManager` by just providing an RPC URL.
 */
export class RPCTransactionManager extends TransactionManager {
  constructor({ rpcUrl, storage }: { rpcUrl: string; storage?: Store }) {
    super({
      transactionSender: new RPC(rpcUrl),
      indexer: new Indexer(rpcUrl),
      storage,
    });
  }
}
