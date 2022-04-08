# `@ckb-lumos/hd-cache`

HD Cache manager for lumos.

## Usage

```javascript
const { CacheManager, CellCollector, CellCollectorWithQueryOptions, getBalance } = require("@ckb-lumos/hd-cache")
const { Indexer } = require("@ckb-lumos/ckb-indexer")
const indexer = new Indexer("http://localhost:8114")
const cacheManger = CacheManager.loadFromKeystore(indexer, "You keystore path", "You password")
// start to sync cache from indexer
cacheManager.startForever()

// if your keystore is from ckb-cli or you set needMasterPublicKey to true, you can get you master public key info by
cacheManager.getMasterPublicKeyInfo() // ckb-cli using this key by default

// now you can using following methods
cacheManager.getNextReceivingPublicKeyInfo()
cacheManager.getNextChangePublicKeyInfo()

// or collect cells  by CellCollectors
const cellCollector = new CellCollector(cacheManager)
// or with queryOptions
const cellCollector = new CellCollectorWithQueryOptions(
  new CellCollector(cacheManger),
  queryOptions,
)

for await (const cell of cellCollector.collect()) {
  console.log(cell)
}

// get HD wallet balance
await getBalance(cellCollector)
```

### how to quickly get transactionCollector

`CKBIndexerTransactionCollector.asBaseTransactionCollector` helps you to get a transactionCollector instance.

```ts
const nodeUri = "htp://127.0.0.1:8118/rpc";
const indexUri = "ttp://127.0.0.1:8120";
const indexer = new CkbIndexer(indexUri, nodeUri);

const ExtendCollector = CKBIndexerTransactionCollector.asBaseTransactionCollector(
  nodeUri
);

const cacheManager = CacheManager.fromMnemonic(
  indexer,
  mnemonic,
  getDefaultInfos(),
  {
    transactionCollector: new ExtendCollector(indexer, query),
    rpc,
  }
);
```