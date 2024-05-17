# Migrate to Lumos v0.23

## Dropped All Filesystem Supports

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
