# `@ckb-lumos/hd`

HD & Mnemonic implementation for lumos.

## Usage

Create a new HD wallet.

```javascript
const { mnemonic, ExtendedPrivateKey, Keystore } = require("@ckb-lumos/hd")
const m = mnemonic.generateMnemonic()
const seed = mnemonic.mnemonicToSeedSync(m)
const extendedPrivateKey = ExtendedPrivateKey.fromSeed(seed)
const keystore = Keystore.create(extendedPrivateKey, "Your password")
// save keystore file
keystore.save("you path, only dir")

// load keystore file
const keystore = Keystore.load("you file path, with file name")
```

Using HD CacheManager

```javascript
const { CacheManager } = require("@ckb-lumos/hd")
const { Indexer } = require("@ckb-lumos/indexer")
const indexer = new Indexer("http://localhost:8114", "./indexer-data")
const cacheManger = CacheManager.loadFromKeystore(indexer, "You keystore path", "You password")
// start to sync cache from indexer
cacheManager.startForever()

// if your keystore is from ckb-cli or you set needMasterPublicKey to true, you can get you master public key info by
cacheManager.getMasterPublicKeyInfo() // ckb-cli using this key by default

// now you can using following methods
cacheManager.getBalance() // or with QueryOptions in arguments
cacheManager.getNextReceivingPublicKeyInfo()
cacheManager.getNextChangePublicKeyInfo()

// or collect cells  by 
cacheManager.cellCollector()
cacheManager.cellCollectorByQueryOptions(queryOptions)
```
