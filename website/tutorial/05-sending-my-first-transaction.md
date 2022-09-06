---
title: 5. Sending my first transaction
sidebar_position: 4
---

# Example: Sending my first transaction

假设bob是一家披萨店，你用了100个CKB向bob订购了一个披萨，现在需要给bob支付这100个ckb，bob告诉你他的address是：`ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f`

## Step1: Config
首先要做的事依然是设置我们的环境，下面这段代码可以让lumos默认使用测试网络的设置，而不是每次都需要显式的设置环境

``` ts
import { config } from '@ckb-lumos/lumos';

config.initializeConfig(config.predefined.AGGRON4);
```

## Step2: Build transaction
`@ckb-lumos`中提供了一些常用的方法，而转账ckb正是一个最常用的方法，我们可以使用这`common`中的方法来帮助我们构造这笔交易

``` ts
import { helpers, commons } from '@ckb-lumos/lumos';

const transfer = async() => {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = await commons.secp256k1Blake160.transfer(
        txSkeleton,
        '<your-address>',
        'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f',
        BigInt(100 * 10 ** 8),
    );
}
```

## Step3: Pay fee
现在我们已经构造出来一个基础的交易，我们给bob转账100个ckb，但是为了让这笔交易成功被打包上链，我们还需要给矿工支付一些fee，lumos中提供了一些方法来支付fee，在这个实例中为了简单起见，我们将交易费设置为1ckb，在正常交易中手续费会根据交易的大小计算，通常会比1ckb低很多很多。

``` ts

import { helpers, commons } from '@ckb-lumos/lumos';

const transfer = async() => {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = await commons.secp256k1Blake160.transfer(
        txSkeleton,
        '<your-address>',
        'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f',
        BigInt(100 * 10 ** 8),
    );

    txSkeleton = await commons.secp256k1Blake160.payFee(
      txSkeleton,
       '<your-address>',
      BigInt(1 * 10 ** 8),
    );
}
```

## Step4: Signing and sending
现在我们已经构造出来一个交易的数据结构，任何人都可以创造出来这样一个结构，但是要如果谁都能发起这笔交易的话，你钱包里的ckb就会被其他人拿走，所以为了确信交易是cell的拥有者授权发布的，我们还需要为这个交易签名，`@ckb-lumos`提供了一些方法可以帮助我们生成交易的简述以及使用椭圆螺旋曲线算法签名，最后我们使用上文中创建的rpc来将交易发布到区块链上

``` ts
import { BI, hd, config, helpers, RPC, Indexer, commons } from '@ckb-lumos/lumos';
const transfer = async() => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.secp256k1Blake160.transfer(
    txSkeleton,
    address,
    to,
    BigInt(100 * 10 ** 8),
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
  console.log(`txHash is: ${txHash}`)
}
```

让我们运行一下这个transfer函数，我们就能看到一个类似`txHash is: 0x998dd1ec986ad0f1aff5f527dc3e9fe13cba0d20ee2e7ee0ce83af213cd399c4`这样的输出，让我们上[区块浏览器](https://pudge.explorer.nervos.org/)中查询一下这笔交易

<img width="1300" alt="image" src="https://user-images.githubusercontent.com/22258327/188527969-0e7b81e0-8c5f-42f8-8278-0b73d81ee7de.png">


我们可以看到交易的内容确实将一个10000ckb的cell消费了，并且为bob生成了一个100ckb的cell以及给自己产生了一笔9899ckb的找零，其中1ckb作为手续费给了矿工，
恭喜！现在你可以躺在沙发上等待享用美味的披萨了
