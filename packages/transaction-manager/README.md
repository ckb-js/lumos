# `@ckb-lumos/transaction-manager`

`TransactionManager` offer a simple way to query and cache the pending transactions, it means you can get the pending cells without waiting for the transaction to be confirmed.

## Quick Start

The easiest way to use the module is to use the `RPCTransactionManager` class, which uses the RPC module to query the pending transactions.

```ts
const indexer = new RPCTransactionManager({ rpcUrl: "https://localhost:8114" });
const collector = indexer.collector({ lock: aliceLock });

for await (const cell of collector.collect()) {
  // do something with the cell
}
```

> Tips:
>
> The `collector` method accepts the same options as the `CkbIndexerQueryOptions` of the `@ckb-lumos/indexer` module,
> but it is a little different from the `CkbIndexerQueryOptions` when querying pending cells.
>
> - `skip` is suppressed when `collector(queryOptions)`, and when `usePendingCells` is set to `true`
> - `fromBlock` and `toBlock` are ignored, pending cells will be returned regardless of the block number.
> - when `order` is set to `desc`, the pending cells will be returned first

## A More Advanced Example

### Custom Cache Storage

`TransactionManager` use an in-memory cache to store the pending transactions by default, but you can also use your own cache storage by passing the `storage` options.

```ts
import { Store } from "@ckb-lumos/transaction-manager";
// set a prefix to avoid the key conflicts other libraries
const CUSTOM_KEY_PREFIX = "__lumos_store__";
const storage: Store = {
  getItem(key) {
    const customKey = CUSTOM_KEY_PREFIX + key;
    const value = window.localStorage.getItem(customKey);
    if (!value) return value;
    // deep clone to avoid the value being modified by the caller
    return JSON.parse(value)[customKey];
  },
  hasItem(key) {
    return !!window.localStorage.getItem(CUSTOM_KEY_PREFIX + key);
  },
  removeItem(key) {
    window.localStorage.removeItem(CUSTOM_KEY_PREFIX + key);
  },
  setItem(key, value) {
    window.localStorage.setItem(CUSTOM_KEY_PREFIX + key, JSON.stringify(value));
  },
};

new RPCTransactionManager({ rpcUrl: "http://localhost:8114", storage });
```
