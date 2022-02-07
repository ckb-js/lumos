## Migrate from native indexer

Lumos is used for execution at the end of the server, so we provide `@ckb-lumos/indexer` and @ckb-`lumos/sql-indexer`. While bringing flexibility, it also increases the complexity of using it, such as having to run the database locally, compile the code, etc.

Now that lumos plans to support running on the web, `native indexer` and `sql-indexerd` cannot run on the web. So we marked `native-indexer` and `sql-indexer` as not recommended in version 0.17.0-rc5, and introduced `ckb-indexer` to support running on web side. in this version, we will remove `native-indexer` and `sql-indexer` directly, if you plan to upgrade If you are planning to upgrade your version of lumos, please refer to this upgrade guide.

### **Start Indexer**

In `native-indexer`, you need to call `indexer.startForever();` . But in the `@ckb-lumos/ckb-indexer`, you don't need to call start anymore, you just need to create an indexer instance and we will turn it on for you automatically.

### Constractor

**CellCollector**

`CellCollertor`'s constructor has a few changes to its parameters. If you don't need the resulting `block_hash`, then you don't need to make the change, just leave it as is.

If you need to return the `block_hash`, then you need to carry carry the third parameter.

```jsx
const otherQueryOptions: OtherQueryOptions = {
    withBlockHash: true,
    ckbRpcUrl: nodeUri,
  };
  const cellCollector = new CellCollector(
    indexer,
   { lock: type }
   otherQueryOptions
  );
```

**TransactionCollector**

The constructor of `TransactionCollector` adds a parameter of `nodeUri`, moving options down to the fourth parameter.

```diff
const transactionCollector = new TransactionCollector(
      indexer,
      query,
+     nodeUri,
     options
   );
```

**TransactionCollector batch request**

indexer no longer exposes RPC to the public, if you need to get a `batchRpc` object, you need to get it from `@cbk-lumos/tooki`

```diff
import {RPC} from '@ckb-lumos/toolkit';

...
-batchRpc = indexer.rpc.batch();
+batchRpc = new PRC(URL).batch()
...
```
