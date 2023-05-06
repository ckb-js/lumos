# `@ckb-lumos/pending-transactions-manager`

## Usage

You can create a `PendingTransactionsManager` by passing a `rpcUrl` and an optional `options` object.

```ts
  delcare const queryOptions: CkbIndexerQueryOptions;
  const manager = new PendingTransactionsManager({
    providers: {
      rpcUrl: "https://testnet.ckb.dev",
    }
  });

  const cellCollector = await manager.collector(queryOptions);
  for await (const cell of cellCollector.collect()) {
    // do something with the cell
  }
```

> Note: `CkbIndexerQueryOptions` used in `transaction-manager` is a partial type of `CkbIndexerQueryOptions` used in `@ckb-lumos/indexer`. The field `skip` is supressed when generating a cell collector `collector(queryOptions)`, and when `usePendingCells` is set to `true`, the field `fromBlock` and `toBlock` are ignored, pending cells will be returned regardless of the block number. The order of the returned cells are on-chain cells come first, followed by pending cells when `order` is set to `asc`(default value is `asc`)， and vice versa.

By default the pending transactions are stored in memory, which means the pending tx infos will be lost if the user refreshes the browser.

To persist the transactions, you can pass a `txStorage` option to the `PendingTransactionsManager` constructor.

```ts
  const manager = new PendingTransactionsManager({
    providers: {
      rpcUrl: "https://testnet.ckb.dev",
    }
    options: {
      txStorage:  new PendingTransactionStorage(YOUR_STORAGE),
    },
  });
```

Especially in browser enviroment, if you want to use `localStorage` as the storage, you can create a `PendingTransactionStorage` instance like this:


```ts
  const manager = new PendingTransactionsManager({
    providers: {
      rpcUrl: "https://testnet.ckb.dev",
    }
    options: {
      txStorage:  new PendingTransactionStorage(createBrowserStorage()),
    },
  });

  function createBrowserStorage() {
    const store: Storage = window.localStorage;
    return {
      getItem(key) {
        const value = store.getItem(key) as string | undefined;
        if (!value) return value as undefined;
        // deep clone to avoid the value being modified by the caller
        return JSON.parse(JSON.stringify(value));
      },
      hasItem(key) {
        return !!store.getItem(key);
      },
      removeItem(key) {
        store.removeItem(key);
        return true;
      },
      setItem(key, value) {
        store.setItem(key, value);
      },
    };
  }

```