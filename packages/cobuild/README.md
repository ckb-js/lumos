# @ckb-lumos/cobuild

A set of tools to work with the CoBuild protocol.

## Quick Start

To work with CoBuild, ensure that locks support the CoBuild protocol, such as Omnilock.

### SighashAll & SighashAllOnly

`SighashAll` & `SighashAllOnly` are both for human-readable signing content to avoid blind signing. The difference is that `SighashAll` includes a `message` of `actions` and `SighashAllOnly` does not

To assemble a `SighashAll` or `SighashAllOnly` transaction is just like assembling a normal transaction, but in a different signing way.

```diff
+ import { prepareCobuildSighashSigningEntries } from '@ckb-lumos/cobuild'
- import { sealTransaction } from '@ckb-lumos/helpers'
+ // the sealTransaction is compatible with the original one in @ckb-lumos/helpers
+ import { sealTransaction } from '@ckb-lumos/cobuid'

txSkeleton = common.prepareSigningEntries(txSkeleton, config);
+ const lockThatSupportsCoBuild = (script: Script) => script.codeHash === CODE_HASH_THAT_SUPPORTS_COBUILD;
+ txSkeleton = prepareCobuildSighashSigningEntries(
+    txSkeleton,
+    lockThatSupportsCoBuild,
+    {actions: [cobuildAction1, cobuildAction2]}
+  )

sealTransaction(txSkeleton, signatures)
```
