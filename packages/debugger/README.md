# @ckb-lumos/debugger

A [ckb-debugger](https://github.com/nervosnetwork/ckb-standalone-debugger) wrapper for lumos,
helping you to debug your transaction without lunching a full node

## Quick Start

```ts
import { createTestContext } from "@ckb-lumos/debugger";

const { executor, scriptConfigs } = createTestContext({
  contract1: { path: path.join("path/to/contracts", "contract1") },
  contract2: { path: path.join("path/to/contracts", "contract2") },
});

// ...

executor.execute(txSkeleton);
```
