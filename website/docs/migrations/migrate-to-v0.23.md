# Migrate to Lumos v0.23

## BREAKING: Dropped All Filesystem Supports

### `@ckb-lumos/config-manager`.`initializeConfig` Dropped The Support for Reading File/Environment Configuration

Lumos dropped the support of reading configuration from `process.env.LUMOS_CONFIG_NAME` and working directory's `config.json`. Please reading the configuration file manually

```diff
+import { readFileSync } from "node:fs"

+const config = readFileSync(path)
+initializeConfig(JSON.parse(config))
```

### `@ckb-lumos/hd`.`Keystore`.`load` and ``save` Are Dropped

### `@ckb-lumos/hd`.`XPubStore`.`load` and ``save` Are Dropped

### `#ckb-lumos/hd-cache`.`CacheManager`.`loadFromKeystore` Is Dropped

Please migrate to `loadFromKeystoreJson`

```diff
-loadFromKeystore(
  indexer,
- path,
+ JSON.parse(fs.readFileSync(path).toString())
```

### RPC `getTransaction`'s Response Has Been Updated

```diff
-min_replace_fee
+minReplaceFee
```

### RPC `get_`'s Response Has Been Updated

```diff
-min_rbf_rate
-tx_size_limit
-max_tx_pool_size
+minRbfRate
+txSizeLimit
+MaxTxPoolSize
```

---

## Common Methods For CKB-Related Objects

The `ModelHelper` provides a set of common methods, such as `create`, `hash`, `clone`, and `equals`, for CKB-related objects.
This helper is designed to work with a `ModelLike` object for convenience, allowing developers to work with ambiguous objects instead of just the strict object.

```ts
export type ModelHelper<Model, ModelLike = Model> = {
  create(modelLike: ModelLike): Model
  equals(modelLike: ModelLike, modelR: ModelLike): boolean
  hash(modelLike: ModelLike): Uint8Array
  clone(model: ModelLike): Model
}
```

```javascript
import { cellHelper } from "@ckb-lumos/helpers"

const cell = cellHelper.create({
  lock: "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5m759c",
})

const _61CKB = 61 * 10 ** 8
asserts(BI.from(cell.cellOutput.capacity).eq(_61CKB)) // 61 CKB
```
