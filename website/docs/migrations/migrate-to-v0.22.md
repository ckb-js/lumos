# Migrate to Lumos v0.22

## Refactor the Entry Package `@ckb-lumos/lumos` for Convenience

Before v0.22, developers usually need to import modules from different packages, especially when they want to use the child modules in Lumos, such as `CKBComponents` in `@ckb-lumos/rpc/lib/types`, it causes that developers need to add many dependencies in `package.json` and import many modules in their code. To solve this problem, we refactor the entry package `@ckb-lumos/lumos` to make it more convenient to use.

We've also split these modules into entry packages to make lumos work smoothly with the modern IDEs, such as VSCode or WebStorm, which can automatically import the modules

![](./0-22/auto-import.gif)

### `@ckb-lumos/lumos`.`toolkit`

- Removed `Reader`, please migrate to `@ckb-lumos/lumos/codec` instead.
- Removed `validators`, please migrate to `@ckb-lumos/lumos/codec`'s `pack/unpack` methods instead.
- Removed `normalizers`, please migrate to `@ckb-lumos/lumos/codec`'s `pack/unpack` methods instead.
- Removed `transformers`, please migrate to `@ckb-lumos/lumos/codec`'s `pack/unpack` methods instead.

### `@ckb-lumos/lumos`.`utils`

- Removed `isDeepEqual`, please use a third-party library like `lodash.isequal` instead.
- Removed `deepCamel`, please use a third-party library like `camelcase-keys` instead.
- Removed `hashCode`, please use a third-party library like `xxHash` instead.
- Removed `toBigUInt64LECompatible`, please use `hexify(Uint64.pack)` instead.
- Removed `toBigUInt128LECompatible`, please use `hexify(Uint128.pack)` instead.
- Added `parseUnit`
- Added `formatUnit`

### `@ckb-lumos/lumos`.`config`

- Deprecated `predefined`, please use `config.MAINNET` or `config.TESTNET` instead.

### `@ckb-lumos/lumos`.'helpers`

The CKB2019 version short address format was deprecated a long time ago and we no longer export these methods.

- Removed `generateSecp256k1Blake160Address`, use `encodeToAddress` instead
- Removed `generateAddress`, use `encodeToAddress` instead
- Removed `scriptToAddress`, use `encodeToAddress` instead
- Removed `generateSecp256k1Blake160MultisigAddress`, use `encodeToAddress` instead
