# `@ckb-lumos/pending-transactions-manager`

## Usage

You can create a `PendingTransactionsManager` by passing a `rpcUrl` and an optional `options` object.

```ts
  const manager = new PendingTransactionsManager({
    rpcUrl: "https://testnet.ckb.dev",
  });

  const cellCollector = await manager.collector(queryOptions);
  for await (const cell of cellCollector.collect()) {
    // do something with the cell
  }
```

By default the pending transactions are stored in memory, which means the pending tx infos will be lost if the user refreshes the browser.

To persist the transactions, you can pass a `txStorage` option to the `PendingTransactionsManager` constructor.

```ts
  const manager = new PendingTransactionsManager({
    rpcUrl: "https://testnet.ckb.dev",
    options: {
      txStorage:  new PendingTransactionStorage(YOUR_STORAGE),
    },
  });
```

Especially in browser enviroment, if you want to use `localStorage` as the storage, you can create a `PendingTransactionStorage` instance like this:


```ts
  const manager = new PendingTransactionsManager({
    rpcUrl: "https://testnet.ckb.dev",
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