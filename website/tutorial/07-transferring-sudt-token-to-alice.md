---
title: 7. Transferring sudt token to Alice
sidebar_position: 6
---

# Advanced: Transferring sudt token to Alice

``` ts
const transferToken = async() => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.sudt.transfer(
    txSkeleton,
    [address],
    args,
    to,
    100,
  );

  txSkeleton = await commons.secp256k1Blake160.payFee(
    txSkeleton,
    address,
    BigInt(1 * 10 ** 8),
  );
  
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  const txHash = await rpc.sendTransaction(tx, "passthrough");
  console.log(`txHash is : ${txHash}`)
}
```
