# `@ckb-lumos/indexer`

CKB indexer used in lumos framework. Might be possible for independent usage as well. It is based on a [Rust based native indexer](https://github.com/quake/ckb-indexer) for stability and performance.

The indexer is designed to consume from the following sources:

* Direct access of CKB's data dir via RocksDB's readonly or secondary mode;
* Consistent queries of CKB's RPC.

It is also designed to store the indexed data in either of the following storage choices:

* A local RocksDB directory;
* Remote SQL database, supported databases now include latest stable versions of PostgreSQL and MySQL. For now, the SQL indexer is maintained as a separate `@ckb-lumos/sql-indexer` package, we might merge the 2 indexer packages into one later.

Note for the moment, SQLite is not officially supported, single-node users or Electron users are highly recommended to use the RocksDB solution.

## Usage

### Start Indexer

```javascript
const { Indexer, CellCollector, TransactionCollector } = require("@ckb-lumos/indexer");
const indexer = new Indexer("http://127.0.0.1:8114", "/tmp/indexed-data");
indexer.startForever();
```


### CellCollector

To query existing cells, you can create a CellCollector:

```javascript
collector = new CellCollector(indexer, {
  lock: {
    code_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hash_type: "data",
    args: "0x62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
  },
});

for await (const cell of collector.collect()) {
  console.log(cell);
}
```

You can also specify both `lock` and `type` script: 
```javascript
collector = new CellCollector(indexer, {
    lock: {
        args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type"
    },
    type: {
        args: "0x",
        code_hash: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hash_type: "type"
    }
})

for await (const cell of collector.collect()) {
  console.log(cell);
}
```



Range query for cells between given block_numbers is supported:

```javascript
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
It will fetch cells between `[fromBlock, toBlock]`, which means both `fromBlock` and `toBlock` are included in query range.

Page jump when queryring cells is supported:

```javascript
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

The `skip` field represents the number of cells being skipped, which in the above code snippet means it would skip the first 100 cells and return from the 101st one.

Order by block number is supported by setting `order` field explicitly:

```javascript
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

```javascript
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

 You can also set it as any when the argsLen of the field args might have multiple possibilities, for example, lock script's args could be 20 in normal scenario and 28 in multisig scenario,  or any other length in customized scenarios. However, there's some performance lost when use `any` rather than explicit specify length due to the low-level implementation.

```javascript
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


Fine grained query for cells can be achieved by using [ScriptWrapper](https://github.com/nervosnetwork/lumos/blob/cd418d258085d3cb6ab47eeaf5347073acf5422e/packages/base/index.d.ts#L123), with customized options like `argsLen`:

```javascript
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
      code_hash: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hash_type: "type",
      args: "0x",
    },
    // when the `argsLen` is not setted here, it will use the outside `argsLen` config, which in this case is -1 by default
  }
});

for await (const cell of cellCollector.collect()) {
  console.log(cell);
}
```

### TransactionCollector 

Similar solution can be used to query for transactions related to a lock script:

```javascript
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hash_type: "data",
    args: "0x62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
  },
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

Range query for transactions between given block_numbers is supported:

```javascript
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
}
```

It will fetch transactions between `[fromBlock, toBlock]`, which means both `fromBlock` and `toBlock` are included in query range.

Page jump when queryring transactions is supported:

```javascript
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

The `skip` field represents the number of transactions being skipped, which in the above code snippet means it would skip the first 100 transactions and return from the 101st one.

Order by block number is supported:

```javascript
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

```javascript
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

 You can also set it as any when the argsLen of the field args might have multiple possibilities, for example, lock script's args could be 20 in normal scenario and 28 in multisig scenario,  or any other length in customized scenarios. However, there's some performance lost when use `any` rather than explicit specify length due to the low-level implementation.

```javascript
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

Fine grained query for transactions can be achieved by using [ScriptWrapper](https://github.com/nervosnetwork/lumos/blob/cd418d258085d3cb6ab47eeaf5347073acf5422e/packages/base/index.d.ts#L123), with customized options like `ioType`, `argsLen`:

```javascript
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
      code_hash: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hash_type: "type",
      args: "0x",
    },
    ioType: "input",
  }
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

The `ioType` field is among `input | output | both`.

### EventEmitter

Event-driven pattern is also supported besides the above polling pattern. After subsribing for certain `lock|type` script, it will emit a `changed` event when a block containing the subsribed script is indexed or rollbacked. 

The principle of the design is unreliable notification queue, so developers are supposed to pull from the data sources via `CellCollector|TransactionCollector`, to find out what might happened: cell consumed, new cell generated, new transaction generated, or a chain fork happened, etc; and take the next step accordingly.

```javascript
eventEmitter = indexer.subscribe({
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
});

eventEmitter.on("changed",  () => {
  console.log("States changed with the script, please pull the data sources from the indexer to find out what happend");
})

```

Other query options like `fromBlock|argsLen|data` are also supported.
```javascript
eventEmitter = indexer.subscribe({
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    // the args bytes length is 18, truncate the last 2 bytes.
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7d",
  },
  // default value is -1
  argsLen: 18,
  // default value is "any"
  data: "0x",
  // default value is 0
  fromBlock: 0x3e8, // "0x" + 1000n.toString(16)
});
```

## Electron note

One design goal of lumos, is that even though we might leverage native Rust code to speed things up, you don't need to have Rust installed in your machine to use the framework. However, this goal hits a slight roadblock since electron have its own module versions.

There are 2 paths to work around this issue:

First, we do provide pre-built binaries linked with electron's node version. Use the following command to install npm dependencies in your Electron app:

```bash
$ LUMOS_NODE_RUNTIME=electron npm i
```

This will make sure that pre-built binaries compiled for Electron will be downloaded.

Second, you can also follow the [steps](https://neon-bindings.com/docs/electron-apps) in Neon's documentation to rebuild the binaries. Note this path would require Rust being installed on your system for now.

Note this issue is actually caused since we are still leveraging the old native node module solution. We are also evaluating other solutions, such as [N-API](https://medium.com/@atulanand94/beginners-guide-to-writing-nodejs-addons-using-c-and-n-api-node-addon-api-9b3b718a9a7f), which is based on a stable API, so there is no need to recompile everything for a different Node.js version. We do hope that in later versions, we can convert to N-API so there is not need to deal with inconsistent module versions.
