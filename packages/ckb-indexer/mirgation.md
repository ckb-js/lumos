## Migrate from native indexer

Lumos is used for execution on server side, so we provide `@ckb-lumos/indexer` and @ckb-`lumos/sql-indexer`. While bringing flexibility, it also increases the complexity of using it, such as you have to run the database locally, compile the code, etc.

Now that lumos plans to support running on the web, we removed `native-indexer` and `sql-indexer`, and introduced `ckb-indexer`. This document is to help you upgrade from the old version.

### **Start Indexer**

Instead of calling `indexer.startForever()` in `native-indexer`, you just need to create an indexer instance in `@ckb-lumos/ckb-indexer`, and we will turn it on for you automatically.

### Constractor

**CellCollector**

To return the `blockHash`, you need to carry carry the third parameter in `CellCollector`.

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

Indexer no longer exposes RPC to the public. If you need to get a `batchRpc` object, you need to get it from `@cbk-lumos/tookit`

```diff
import {RPC} from '@ckb-lumos/toolkit';

...
-batchRpc = indexer.rpc.batch();
+batchRpc = new PRC(URL).batch()
...
```
