# Lumos & Omnilock Administrator mode

Nervos maintains a powerful lock
called [Omni Lock](https://github.com/XuJiandong/docs-bank/blob/master/omni_lock.md) (previously named RC lock), which
can use private key as a signer. This example will show how to use Lumos to send a transaction using Omni lock Administrator mode

## Quick Start

```
$ yarn
$ yarn build
```

use lib
```
$ node --experimental-repl-await

# import lib
node> omni = require("./index")

# generate white list sparse merkle tree root & proof
node> { root, proof } = omni.generateWLRule([omni.alice.lockScript.args])

# deploy white list cell with typeId
node> rceCellScript = await omni.deployRCE({ from: omni.alice.address, fromPrivKey: omni.alice.privKey, root })

# generate bob's omnilock administrator addr
node> bobOmniAddr = omni.generateOmniLockAdministratorAddress(omni.bob.lockScript.args.substring(2), rceCellScript.CODE_HASH.substring(2))

# get test CKB from https://faucet.nervos.org/

# wait a moment, and we can find bob's omnilock administrator addr has test CKB

# unlock by administrator (alice) pubkey hash
node> txSkeleton = await omni.buildTransferByOmnilockAdministrator({
  rceCellConfig: rceCellScript,
  from: bobOmniAddr,
  to: omni.alice.address,
  amount: "10000000000",
});

node> signedTx = omni.sealOmnilockTxSkeleton(txSkeleton, omni.alice.privKey, omni.alice.lockScript.args, proof);

node> txHash = await omni.rpc.send_transaction(signedTx, "passthrough");
```
