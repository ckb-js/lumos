---
title: 4. Checking the CKB balancelet 
sidebar_position: 3
---

# Checking the CKB balance
在上节中我们知道了如何使用ckb生成一个地址，本篇中我们会学习如何查询这个地址的余额，以及从哪里能获取到一些测试代币

#### Step 1: Config
ckb节点提供了一些rpc方法来支持用户搜索一些链上数据，但是许多链上数据索引起来非常麻烦，为了方便检索，ckb还提供了一个indexer项目，帮助对链上数据进行索引和速查，我们首先配置一下项目中会用到的ckb rpc和indexer的设置

``` ts
import { RPC, Indexer } from '@ckb-lumos/lumos';
const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
```

#### step 2: Collect Cell with Indexer
终于到了激动人心的查询环节，在ckb中，我们把存储数据的单元称之为`Cell`, 而ckb余额作为Cell的capacity属性，当我们想知道自己有多少余额的时候就需要找到自己所有的Cell

``` ts
import { BI, helpers } from '@ckb-lumos/lumos';

export async function getBalance(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}
```

恭喜，我们现在创建了一个获取余额的函数，现在可以输出一下看看我们刚刚创建的address中有多少ckb
``` ts
console.log(`address: ${address}`)
getBalance(address).then(capacity => console.log(`balance: ${capacity.toString()} CKB`))
```
或许你会获得一个类似这样的输出

```
address: <your-address>
balance: 0 CKB
```

### Step 3: Get test CKB from faucet
看起来我们现在还没有任何CKB，别难过，ckb的测试网提供了一个水龙头，我们可以从水龙头中获取一些ckb，点击[这里](https://faucet.nervos.org/)来访问水龙头

<img width="1424" alt="image" src="https://user-images.githubusercontent.com/22258327/188526028-93e26b00-c79d-4e17-b2d5-1b1c8b8071bb.png">

打开后你或许会看到这样一个页面，现在将我们之前生成的address填入中间的输入框后点击Claim按钮，之后你会看到网页中多了一条这样的数据

<img width="987" alt="image" src="https://user-images.githubusercontent.com/22258327/188526096-fd1e91bb-4f83-4c95-aed1-8b054e350d0d.png">

在等待大约10s左右后，这条数据的状态会从Pending变成Processed，让我们再次运行我们的钱包项目，检查一下我们的余额

``` ts
address: <your-address>
balance: 10000 CKB
```
看起来目前为止咱们的钱包项目运行的没什么问题，咱们现在有CKB了，但是光查看CKB是没用的，还需要让这笔CKB可以自由转账，在下节中将学会一个转账的实例
