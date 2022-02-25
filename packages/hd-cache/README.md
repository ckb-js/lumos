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
