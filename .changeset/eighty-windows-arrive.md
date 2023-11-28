---
"@ckb-lumos/common-scripts": minor
"@ckb-lumos/debugger": minor
"@ckb-lumos/e2e-test": minor
"@ckb-lumos/molecule": minor
"@ckb-lumos/bundler": minor
"@ckb-lumos/helpers": minor
"@ckb-lumos/toolkit": minor
"@ckb-lumos/crypto": minor
"@ckb-lumos/codec": minor
"@ckb-lumos/lumos": minor
"@ckb-lumos/base": minor
"@ckb-lumos/bi": minor
"@ckb-lumos/hd": minor
"@ckb-lumos/ckb-indexer": minor
"@ckb-lumos/config-manager": minor
"@ckb-lumos/experiment-tx-assembler": minor
"@ckb-lumos/hd-cache": minor
"@ckb-lumos/light-client": minor
"@ckb-lumos/rpc": minor
"@ckb-lumos/runner": minor
"@ckb-lumos/testkit": minor
"@ckb-lumos/transaction-manager": minor
"@ckb-lumos/utils": minor
---

Making it compatible with the ES module specification, if the `moduleResolution` is NOT `node` in your TypeScript project, please update your import path to the following:

```diff
-import { moduleName } from '@ckb-lumos/pkgName/lib/fileName'
+import { moduleName } from '@ckb-lumos/pkgName[/exportName]'
```
