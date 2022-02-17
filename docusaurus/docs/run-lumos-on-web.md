---
sidebar_position: 2
---

# Now lumos can run in a web browser

### TL;NR

lumos 最初运行时只为支持 NodeJS，并没有考虑运行在 web 环境中。为了在 web 端运行，我们用 ckb-indexer 替换了 native indexer，增加大数库 BI 等一系列升级，使 lumos 可以运行在 web 环境下

下面获取余额的示例，将为你展示如何在你的 web 项目中使用 lumos。

```shell
npm install @ckb-lumos/lumos
# yarn add @ckb-lumos/lumos
```

```jsx
import { Script, Indexer, BI } from "@ckb-lumos/lumos";

async function main(): Promise<BI> {
  const lock = { code_hash: '0x...', hash_type: 'type', args: '0x...' }
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

完整的示例请参考 [ckb-indexer-collector example](https://github.com/nervosnetwork/lumos/blob/develop/examples/ckb-indexer-collector.ts)

### ckb-indexer

因为 `@ckb-lumos/indexer` 和 `@ckb-lumos/sql-indexer` 使用时需要在本地启动数据库和编译代码，无法在 web 端运行，所以我们 推出了 `@ckb-lumos/ckb-indexer`, 并逐步移除了 `@ckb-lumos/indexer` 和 `@ckb-lumos/sql-indexer` . `@ckb-lumos/ckb-indexer` 的使用示例如下.

```jsx
const { Indexer } = require ("@ckb-lumos/ckb-indexer");
const nodeUri = "https://testnet.ckb.dev/rpc";
const indexUri = "https://testnet.ckb.dev/indexer";
const indexer = new Indexer (indexUri, nodeUri);
```

具体使用教程，请参考 [ckb-indexer 使用指导](https://github.com/nervosnetwork/lumos/tree/develop/packages/ckb-indexer).

如需从 `@ckb-lumos/indexer` 迁移到 `@ckb-lumos/ckb-indexer` , 请参考 [迁移文档.](https://github.com/nervosnetwork/lumos/blob/develop/packages/ckb-indexer/mirgation.md)

### root package

`@ckb-lumos` 组织下有多个包，例如 `@ckb-lumos/helpers`,`@ckb-lumos/config` 等。用户在使用的时候需要单独引用一个包。比如 要使用 `parseAddress` 就要引用 `@ckb-lumos/helpers`. 使用 `initializeConfig` 就要引用 `@ckb-lumos/config`

为了方便用户使用，我们推出了新的 `@ckb-lumos/lumos` 包。包含所有的子包，无需再逐一引入子包.

```jsx
import {
  Script,
  Indexer as CkbIndexer,
  helpers,
  config,
} from "@ckb-lumos/lumos";

config.initializeConfig(config.predefined.AGGRON4);
const address = "ckt1qyqxgftlqzmtv05cwcyl4xlz6ryx6dgsyrasjrp27t";
const lock: Script = helpers.parseAddress(address);
```

### BI 大数库

为了方便大数的计算，我们提供了 [大数库 BI](https://github.com/nervosnetwork/lumos/tree/develop/packages/bi). 可以进行字 符串，数字等和 BI 的相互转换和一些常见运算.

```jsx
import { BI } from "@ckb-lumos/bi";

BI.from (1).add (1)
```

更多使用 API 请参考 [BI 测试用例](https://github.com/nervosnetwork/lumos/blob/develop/packages/bi/tests/index.test.ts)

### 更多更新

1. 将 ckb-js-toolkit 迁移到 @ckb-lumos/toolkit

     [ckb-js-toolkit](https://github.com/nervosnetwork/ckb-js-toolkit) 是一个帮助 ckb 用户开发 `dapp` 的工具。它提供了一系列独立的工具，例如 `reader`,`rpc` 等，现在已经被整合到 `@ckb-lumos/toolkit` 包中。作为 `lumos` 的一部分已经维护.

2. 新地址的转换

    ckb2021 升级了 [地址](https://github.com/nervosnetwork/rfcs/pull/239/files),lumos 也跟进了对新地址的支持，增加了 `encodeToAddress` 等方法，具体的更新请参考 [PR](https://github.com/nervosnetwork/lumos/pull/205)

3. 示例代码的增加

    增加了 `secp256k1-transfer`,`secp256k1-multisig-transfer`,`pw-lock-metamask`,`omni-lock-metamask` 等示例代码，具体代码请参考 [lumos/example](https://github.com/nervosnetwork/lumos/tree/develop/examples)

4. 在线工具

    在线工具支持 script 和 address 之间的相互转换。访问链接 [🔗](https://nervosnetwork.github.io/lumos/tools/address-conversion)

5. [lumos playground](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js)

    我们使用 codesandbox 和 `@ckb-lumos/lumos`, 搭建了 `lumos` 的 [playground](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js), 你可以在 [playground](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js) 里快速尝试 `lumos` 的功能。访问链接 [🔗](https://codesandbox.io/s/objective-cloud-282i4?file=/src/index.js)

6. 在 lumos 中提供了合约部署的 generator, 方便了合约的部署，访问链接 [🔗](https://github.com/nervosnetwork/lumos/tree/develop/packages/common-scripts#usage)

### 后续计划

1. 整合 [moleculec](https://github.com/nervosnetwork/molecule).
2. 提供更多的工具函数，方便操作交易结构.
3. 整合 [standalone debugger](https://github.com/nervosnetwork/ckb-standalone-debugger) 让单元测试脱链.
