CKB indexer is based on  [ckb-indexer](https://github.com/nervosnetwork/ckb-indexer) with more features. It is designed for:

- Web client usage.
- CKB's RPC query.

## **Usage**

### **Indexer**

```jsx
const { Indexer } = require("@ckb-lumos/ckb-indexer");
const nodeUri = "https://testnet.ckb.dev/rpc";
const indexUri = "https://testnet.ckb.dev/indexer";
const indexer = new Indexer(indexUri, nodeUri);
```

### **CellCollector**

To query existing cells, you can create a CellCollector:

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hash_type: "data",
    args: "0x62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
  },
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

Specify `lock` or `type` script as constraints for advance search:

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
  },
  type: {
    args: "0x",
    code_hash:
      "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hash_type: "type",
  },
});
```

Query cells in certain block_numbers range (`fromBlock` and `toBlock` are included):

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  fromBlock: "0x225510", // "0x" + 2250000n.toString(16)
  toBlock: "0x225ce0", // "0x" + 2252000n.toString(16)
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

Skip a certain number of query results, e.g. the below code snippet means it would skip the first 100 cells and return from the 101st one

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  skip: 100,
});

for await (const tx of cellCollector.collect()) {
  console.log(tx);
}
```

Order by block number is supported by setting `order` field explicitly:

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  fromBlock: "0x253b40", // "0x" + 2440000n.toString(16)
  toBlock: "0x253f28", // "0x" + 2441000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 300,
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

Prefix search is supported on `args`. The default `argsLen` is -1, which means you pass the full slice of original args, and you can specify it when the `args` field is the prefix of original args.

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df3", // truncate the last byte of orignal args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  argsLen: 20, // default option is -1
  fromBlock: "0x253b40", // "0x" + 2440000n.toString(16)
  toBlock: "0x253f28", // "0x" + 2441000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 300,
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

You can also set it as `any` when the argsLen has multiple possibilities. For example, lock script's args is 20 in normal scenario and 28 in multisig scenario, or any other length in customized scenarios.

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d", // truncate the last two bytes of original args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  argsLen: "any",
  fromBlock: "0x253b40", // "0x" + 2440000n.toString(16)
  toBlock: "0x253f28", // "0x" + 2441000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 300,
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

Fine grained query for cells can be achieved by using [ScriptWrapper](https://github.com/ckb-js/lumos/blob/cd418d258085d3cb6ab47eeaf5347073acf5422e/packages/base/index.d.ts#L123), with customized options like `argsLen`:

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xe60f7f88c94ef365d540afc1574c46bb017765", // trucate the last byte of original args: 0xe60f7f88c94ef365d540afc1574c46bb017765a2
    },
    argsLen: 20,
  },
  type: {
    script: {
      code_hash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hash_type: "type",
      args: "0x",
    },
    // when the `argsLen` is not setted here, it will use the outside `argsLen` config, which in this case is -1 by default
  },
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

`outputDataLenRange` for filtering cell by data length, and `outputCapacityRange` for filtering cell by capacity:

```jsx
cellCollector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d", // truncate the last two bytes of original args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  outputDataLenRange: [0x0, 0x160],
  outputCapacityRange: [0x10000, 0x100000],
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

To return block_hash in the result, add the following query options:

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

### **TransactionCollector**

Similar usage for quering transactions:

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hash_type: "data",
    args: "0x62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
  },
  CKBRpcUrl,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

Query cells in certain block_numbers range (`fromBlock` and `toBlock` are included):

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  fromBlock: "0x0", // "0x" + 0n.toString(16)
  toBlock: "0x7d0" , // "0x" + 2000n.toString(16)
});

for await (const tx of txCollector.collect()) {
  console.log(tx);

```

Skip a certain number of query results, e.g. the below code snippet means it would skip the first 100 cells and return from the 101st one.

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  skip: 100,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

Order by block number is supported:

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  fromBlock: "0x4e20", // "0x" + 20000n.toString(16)
  toBlock: "0x5208", // "0x" + 21000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 10,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

Prefix search is supported on `args`. The default `argsLen` is -1, which means you pass the full slice of original args, and you can specify it when the `args` field is the prefix of original args.

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df3", // truncate the last byte of orignal args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  argsLen: 20, // default option is -1
  fromBlock: "0x253b40", // "0x" + 2440000n.toString(16)
  toBlock: "0x253f28", // "0x" + 2441000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 300,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

You can also set it as `any` when the argsLen of the field args might have multiple possibilities, for example, lock script's args could be 20 in normal scenario and 28 in multisig scenario, or any other length in customized scenarios. However, there's some performance lost when use `any` rather than explicitly specified length due to the low-level implementation.

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d", // truncate the last two bytes of original args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  argsLen: "any",
  fromBlock: "0x253b40", // "0x" + 2440000n.toString(16)
  toBlock: "0x253f28", // "0x" + 2441000n.toString(16)
  order: "desc", // default option is "asc"
  skip: 300,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

Fine grained query for transactions can be achieved by using [ScriptWrapper](https://github.com/ckb-js/lumos/blob/cd418d258085d3cb6ab47eeaf5347073acf5422e/packages/base/index.d.ts#L123), with customized options like `ioType`, `argsLen`:

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xe60f7f88c94ef365d540afc1574c46bb017765", // trucate the last byte of original args: 0xe60f7f88c94ef365d540afc1574c46bb017765a2
    },
    ioType: "both",
    argsLen: 20, // when the `argsLen` is not setted here, it will use the outside `argsLen` config
  },
  type: {
    script: {
      code_hash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hash_type: "type",
      args: "0x",
    },
    ioType: "input",
  },
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

The `ioType` field is among `input | output | both`.

`outputDataLenRange` is support to filter cell by data length, `outputCapacityRange` is support to filter cell by capacity。you can use as below.

```jsx
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d", // truncate the last two bytes of original args: 0xa528f2b9a51118b193178db4cf2f3db92e7df323
  },
  outputDataLenRange: [0x0, 0x160],
  outputCapacityRange: [0x10000, 0x100000],
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

### **EventEmitter**

Besides polling pattern, event-driven pattern is also supported. After subsribing for certain `lock|type` script, it will emit a `changed` event when a block containing the subsribed script is indexed or rollbacked.

The principle of the design is unreliable notification queue, so developers are supposed to pull from the data sources via `CellCollector|TransactionCollector`, to find out what might happened: cell consumed, new cell generated, new transaction generated, or a chain fork happened, etc; and take the next step accordingly.

```jsx
eventEmitter = indexer.subscribe({
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
});

eventEmitter.on("changed", () => {
  console.log(
    "States changed with the script, please pull the data sources from the indexer to find out what happend"
  );
});
```

Other query options like `fromBlock|argsLen|data` are also supported.

```jsx
eventEmitter = indexer.subscribe({
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    // the args bytes length is 18, truncate the last 2 bytes.
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d",
  },
  // default value is -1
  argsLen: 20,
  // default value is "any"
  data: "0x",
  // default value is 0
  fromBlock: 0x3e8, // "0x" + 1000n.toString(16)
});
```

Listen to median time change when blocks changed.

```jsx
const medianTimeEmitter = indexer.subscribeMedianTime();
medianTimeEmitter.on("changed", (medianTime) => {
  console.log(medianTime);
});
```

## **Migration**

If you want to migrate native indexer to ckb-indexer, please check more detail in our [migration docs](https://github.com/ckb-js/lumos/blob/develop/packages/ckb-indexer/mirgation.md)
