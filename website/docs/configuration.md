---
sidebar_position: 3
---

# Configuration

Lumos introduces a `Config` type for generating script, parsing address, assembling transaction, and more.

## Overview

```js
import { config, RPC } from "@ckb-lumos/lumos"

// step 1. choose or create a config
const myConfig = config.predefined.MAINNET
const rpc = new RPC("https://mainnet.ckb.dev")

// step 2(optional). refresh it at first if the dApp uses upgradable scripts to keep the config fresh
myConfig.SCRIPTS = await refreshScriptConfigs(configs.SCRIPTS, { resolve: config.createRpcResolver(rpc) })

// step 3. initialize to set up dApp
initializeConfig(myConfig)
```

## Introduction

The config is straightforward, consisting of a `PREFIX` field used for address-related methods(e.g. `parseAddress`, `encodeToAddress`, `transfer`) and a `SCRIPTS` field for named script(contract) configs.

```ts
interface Config {
  /**
   * - "ckt" for the testnet
   * - "ckb" for the mainnet
   */
  PREFIX: "ckt" | "ckb"
  SCRIPTS: ScriptConfigs
}
```

Here's a breakdown of the named config `ScriptConfigs`.

```ts
// a key-value object for named ScriptConfig
type ScriptConfigs = Record<string, ScriptConfig>

type ScriptConfig = {
  CODE_HASH: Hash
  HASH_TYPE: HashType
  TX_HASH: Hash
  INDEX: Hexadecimal
  DEP_TYPE: "depGroup" | "code"
  /**
   * The SHORT_ID is no longer in use after CKB2021 address changes
   * @deprecated the short address will be removed in the future
   * Short ID for creating CKB address, not all scripts have short IDs.
   */
  SHORT_ID?: number
}
```

> Note: the `SHORT_ID` is deprecated and should not be used after CKB2021.It's included for compatibility with deprecated short format addresses

## Priority

Lumos uses config with the following priority:

1. the last optional parameter containing a field `config: Config`
2. config set up by `initializeConfig`
3. mainnet config

> Note: make sure only one version of Lumos in the project to avoid conflicts with default config. [Npm overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json/#overrides), [Yarn resolution](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/), and [Pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) are helpful for enforcing the use of a single version of a dependency

Several methods(e.g. `encodeToAddress`, `common.injectCapacity`) accept a parameter `{config? :Config}` to override the default config. If you find inconsistency in your project, please check if you forget providing the last optional config.

## Initialize

Two predefined configs are provided by `@ckb-lumos/config-manager`, `LINA` for the mainnet and `AGGRON4` for the testnet. The `LINA` config is used by default. If you want to interact with the testnet.

```js
initializeConfig(predefined.AGGRON4)
```

### Devnet

For testing with the private devnet, the `generateGenesisScriptConfigs` function can be useful:

```ts
declare function generateGenesisScriptConfigs(
  genesisBlock: Block
): Record<"SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "DAO", ScriptConfig>

// generate the ScriptConfigs from the genesis block
const genesisBlock = await rpc.getBlockByNumber("0x0")
const SCRIPTS = generateGenesisScriptConfigs(genesisBlock)

initializeConfig({ PREFIX: "ckt", SCRIPTS })
```

> Note: The `generateGenesisScriptConfigs` only generates config from the genesis block, including `SECP256K1_BLAKE160`, `SECP256K1_BLAKE160_MULTISIG`, and `DAO`. For non-genesis scripts, provide them after deployment

## Refresh

### Simple (Refreshing Global Config)

If a script is deployed with a [Type ID](https://xuejie.space/2020_02_03_introduction_to_ckb_script_programming_type_id/), it's considered upgradable. After upgrading the script, its config should be updated in the dApp. To enable hot replacement of the config, use the `refreshScriptConfigs` API before initializing the config

```ts
const SCRIPTS = await refreshScriptConfigs(scriptConfigs, { resolve: config.createRpcResolver(rpc) })

initializeConfig({ PREFIX, SCRIPTS })
```

### Advanced (Refreshing Before Signing)

The previous refresh strategy may not be timely enough, as the config is only refreshed once at the beginning. However, the update could occur anytime, even while users are using the dApp.
To ensure more timely refreshing, you can refresh the config before signing a transaction using the `refreshTypeIdCellDeps` function. This function refreshes the `cellDeps` of the `TransactionSkeletonType` and is recommended to be called before `prepareSigningTransaction`:

```ts
txSkeleton = await refreshTypeIdCellDeps(txSkeleton, { resolve: rpcResolver })
txSkeleton = prepareSigningEntries(txSkeleton)
```

### Advanced (Refreshing OutPoint)

If you are not using `TransactionSkeleton`, the resolver created by `createRpcResolver` is helpful to resolve the latest `OutPoint`s

```ts
const resolve: (outPoints: OutPoint[]) => Promise<OutPoint[]> = createRpcResolver(rpc)
const refreshedOutPoints: OutPoint[] = await resolve(outPoints) // => refreshed outpoints
```
