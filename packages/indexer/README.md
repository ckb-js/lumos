# `@lumos/indexer`

CKB indexer used in lumos framework. Might be possible for independent usage as well. It is based on a [Rust based native indexer](https://github.com/quake/ckb-indexer) for stability and performance.

The indexer is designed to consume from the following sources:

* Direct access of CKB's data dir via RocksDB's readonly or secondary mode;
* Consistent queries of CKB's RPC.

It is also designed to store the indexed data in either of the following storage choices:

* A local RocksDB directory;
* Remote SQL database, supported databases now include latest stable versions of PostgreSQL and MySQL.

Note for the moment, SQLite is not officially supported, single-node users or Electron users are highly recommended to use the RocksDB solution.

## Usage

```
const { Indexer, CellCollector } = require('@lumos/indexer');
const indexer = new Indexer("http://127.0.0.1:8114", "/tmp/indexed-data")
indexer.startForever();
```

To query existing cells, you can create a CellCollector:

```
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

```
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
