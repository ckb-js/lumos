---
title: Run Lumos in the Browser
sidebar_position: 2
---

# Run Lumos in the Browser

### TL;DR

Lumos was originally run on NodeJS only. To run on browser, we replaced native indexer with ckb-indexer, added BI which is a big number library, and a series of other upgrades.

The following example of getting the balance will show you how to use lumos in your web project.

```shell
npm install @ckb-lumos/lumos
# yarn add @ckb-lumos/lumos
```

```ts
import { Script, Indexer, BI } from "@ckb-lumos/lumos";

async function main(): Promise<BI> {
  const lock = { code_hash: "0x...", hash_type: "type", args: "0x..." };
  const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
  const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
  const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
  const collector = indexer.collector({ lock });
  let balance: BI = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cell_output.capacity);
  }
  return balance;
}

main();
```

please refer to [ckb-indexer-collector example](https://github.com/nervosnetwork/lumos/blob/develop/examples/ckb-indexer-collector.ts) for a complete example.

### ckb-indexer

Because `@ckb-lumos/indexer` and `@ckb-lumos/sql-indexer` need to start the database and compile the code locally, cannot be run on the web side, we removed them and introduced `@ckb-lumos/ckb-indexer`. Examples of how to use `@ckb-lumos/ckb-indexer` are as follows.

```jsx
const { Indexer } = require("@ckb-lumos/ckb-indexer");
const nodeUri = "https://testnet.ckb.dev/rpc";
const indexUri = "https://testnet.ckb.dev/indexer";
const indexer = new Indexer(indexUri, nodeUri);
```

For a detailed tutorial, please refer to the [ckb-indexer User Guide](https://github.com/nervosnetwork/lumos/tree/develop/packages/ckb-indexer).

To migrate from `@ckb-lumos/indexer` to `@ckb-lumos/ckb-indexer`, please refer to the [migration documentation](https://github.com/nervosnetwork/lumos/blob/develop/packages/ckb-indexer/mirgation.md).

### root package

There are multiple packages under the `@ckb-lumos` organization, such as `@ckb-lumos/helpers`, `@ckb-lumos/config`, etc. The user needs to refer to a separate package when using it. For example, to use `parseAddress` you need to refer to `@ckb-lumos/helpers`. To use `initializeConfig`, you need to refer to `@ckb-lumos/config`.

For your convenience, we have introduced the new `@ckb-lumos/lumos` package. All subpackages are included, so there is no need to introduce them one by one.

```ts
import {
  Script,
  Indexer,
  helpers,
  config,
} from "@ckb-lumos/lumos";
config.initializeConfig(config.predefined.AGGRON4);
const address = "ckt1qyqxgftlqzmtv05cwcyl4xlz6ryx6dgsyrasjrp27t";
const lock: Script = helpers.parseAddress(address);
```

### BI big number library

In order to facilitate the calculation of large numbers, we provide the [large number library BI](https://github.com/nervosnetwork/lumos/tree/develop/packages/bi). You can convert strings, numbers, etc. to and from BI and perform some common operations.

```jsx
import { BI } from "@ckb-lumos/bi";

BI.from(1).add(1);
```

For more use of the API, please refer to [BI Test Cases](https://github.com/nervosnetwork/lumos/blob/develop/packages/bi/tests/index.test.ts).

### More Updates

1. Migrate ckb-js-toolkit to @ckb-lumos/toolkit

   [ckb-js-toolkit](https://github.com/nervosnetwork/ckb-js-toolkit) is a tool to help ckb users develop `dapp`. It provides a set of standalone tools such as `reader`, `rpc`, etc., which have now been integrated into the `@ckb-lumos/toolkit` package. It has been maintained as part of `lumos`.

2. Conversion of new addresses

   Lumos also supports ckb2021 upgraded [address](https://github.com/nervosnetwork/rfcs/pull/239/files), adding methods such as `encodeToAddress`. Refer to this [PR](https://github.com/nervosnetwork/lumos/pull/205) for more.

3. Example code additions

   Added `secp256k1-transfer`, `secp256k1-multisig-transfer`, `pw-lock-metamask`, `omni-lock-metamask` and other sample code, please refer to [lumos/example](https://[github.com/nervosnetwork/lumos/tree/develop/examples)

4. Online tools

   The online tool supports interconversion between script and address. Visit the link [🔗](https://nervosnetwork.github.io/lumos/tools/address-conversion)

5. [lumos playground](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js)

   We used codesandbox and `@ckb-lumos/lumos` to build the [playground](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js) where you can quickly try out the features of lumos.

6. A contract deployment generator is provided in lumos to facilitate the deployment of contracts, visit the link [🔗](https://github.com/nervosnetwork/lumos/tree/develop/packages/common-scripts#usage)

### Follow-up plan

1. integrate [moleculec](https://github.com/nervosnetwork/molecule).
2. provide more tool functions to facilitate the manipulation of transaction structures.
3. Integrate [standalone debugger](https://github.com/nervosnetwork/ckb-standalone-debugger) to allow unit testing offline.
