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

```javascript
const { Indexer, CellCollector } = require("@ckb-lumos/indexer");
const indexer = new Indexer("http://127.0.0.1:8114", "/tmp/indexed-data");
indexer.startForever();
```

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

Prefix search is supported on `args`.

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

Query transactions between given `block_number` range is supported:

```javascript
txCollector = new TransactionCollector(indexer, {
  lock: {
    code_hash: 
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
  },
  fromBlock: 1000,
  toBlock: 10000,
});

for await (const tx of txCollector.collect()) {
  console.log(tx);
}
```

It will fetch transactions between `[fromBlock, toBlock]`, which means both `fromBlock` and `toBlock` are included in query range.

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
