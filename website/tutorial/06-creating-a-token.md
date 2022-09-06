---
title: 6. Creating a token (similar to ERC20)
sidebar_position: 5
---

# Advanced: Creating a token (similar to ERC20)
或许你有听说过shiba币，在2021年时非常热门，不知道你有没有过一点好奇，为什么区块链上能出现那么多种不同的代币，在本章节中，我们会发行一个猫猫币，可以送给朋友或者作为积分发放给你的俱乐部成员

``` ts
const issueToken = async () => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.sudt.issueToken(
    txSkeleton,
    address,
    1000,
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
