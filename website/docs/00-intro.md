---
slug: /
sidebar_position: 1
---

# Tutorial: Step-by-step create a wallet with Lumos 

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

We will create a simple wallet to help manage assets on the ckb chain. We won't delve into the shape of the wallet product in this tutorial, but we have implemented some simple logic that most wallets have

 - Generate private key and address
 - Check own's ckb balance
 - Transfer ckb to other users

This simple example can help to understand how to develop ckb dapp with `Lumos`.

### 1. Create a new Lumos project
We will use the Node.js package manager (npm) to install Lumos, which is both a package manager and an online repository for JavaScript code.
:::tip
If you don't have Node.js, you can get help [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
:::

You can use other package managers in Node.js, but we recommend that you use npm to follow this tutorial.

Create a new folder by opening a new terminal and running the following command.

``` shell
mkdir lumos-tutorial
cd lumos-tutorial
```

Then initialize an npm project, as shown below. You will be prompted to answer some questions.

:::tip
Use the tabs in the snippet to select your preferred package manager.
:::

```mdx-code-block
<Tabs>
  <TabItem value="npm" label="npm" default>
```

``` shell
  npm init
```

```mdx-code-block
  </TabItem>
  <TabItem value="yarn" label="yarn">
```

``` shell
  yarn init
```

```mdx-code-block
  </TabItem>
</Tabs>
```

Now we can install Lumos
```mdx-code-block
<Tabs>
  <TabItem value="npm" label="npm" default>
```

``` shell
  npm install @ckb-lumos/lumos
```

```mdx-code-block
  </TabItem>
  <TabItem value="yarn" label="yarn">
```

``` shell
  yarn add @ckb-lumos/lumos
```

```mdx-code-block
  </TabItem>
</Tabs>
```

### 2. Generate a wallet account

Run the following command to create a new file：

``` shell
touch wallet.ts
```

For a wallet, the most important and commonly used function is to view your account and balance. This tutorial generates private key and address by `@ckb-lumos/hd`

``` ts
import { hd } from '@ckb-lumos/lumos';
const { mnemonic, ExtendedPrivateKey } = hd;

export const generatePrivateKey = () => {
  const m = mnemonic.generateMnemonic()
  const seed = mnemonic.mnemonicToSeedSync(m)
  return ExtendedPrivateKey.fromSeed(seed).privateKey
}
```


CKB has the testnet `Arggon` and the mainnet  `Lina`, `Lumos` can work on different environment.

This tutorial will use the testnet.

lumos has a `config` module to help us manage the config of the different envrioment

``` ts
import { config } from '@ckb-lumos/lumos';

config.initializeConfig(config.predefined.AGGRON4);
```

After setting up the environment, we need to implement a generate address function

``` ts
import { hd, config, helpers } from '@ckb-lumos/lumos';

const getAddressByPrivateKey = (privateKey: string) => {
  const args = hd.key.privateKeyToBlake160(privateKey);
  const template = config.predefined.AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };

  return helpers.encodeToAddress(lockScript);
}
```

Now we can try to run the code just wrote

:::caution
When you generate a private key, keep it in a safe place and do not disclose it to anyone, otherwise the asset may not be unlocked or lost.
:::

``` ts
const privateKey = generatePrivateKey()
const address = getAddressByPrivateKey(privateKey);
console.log('privateKey: ', privateKey)
console.log('address: ', address)
```
Iog printed on the screen, Let's copy the privateKey and keep it in a safe place for now
:::info
It's a sample print, dont use this sample account directly.
:::

```shell
privateKey: 0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3
address:  ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0820lwy5m5uqnhpap2h0kms9ta3u3pp2ss889v4
```


### 3. Check CKB Balance
In the previous section we generated account, but for a wallet it's not enough, we need to know how much CKB balance we have


ckb node provides some rpc methods for support users to search some on-chain data, but many on-chain data are very troublesome to index. so ckb also provides an indexer rpc to help easy search it


:::tip
You can view the public rpc of the testnet and mainnet [here](https://github.com/cryptape/lumos-ckit-internal/wiki/Public-Node-Entries)
:::

``` ts
import { RPC, Indexer } from '@ckb-lumos/lumos';

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
```

In CKB, we call the UTXO is `Cell`, and the CKB balance as the capacity property of the `Cell`, when we want to know how much balance we have we need to find all our Cells

``` ts
import { BI, helpers } from '@ckb-lumos/lumos';

export async function getCapacities(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let capacities = BI.from(0);
  for await (const cell of collector.collect()) {
    capacities = capacities.add(cell.cellOutput.capacity);
  }

  return capacities;
}
```

Congratulations! we write a function to get the balance of account, now we can call it to get our balances

:::note
The unit of capacity in CKB is Shannon, 1CKB = 10^8 Shannon, so here we have to divide by 10^8 to get the unit of CKB
:::

``` ts
console.log(`address: ${address}`)
getCapacities(address).then(capacities => console.log(`balance: ${capacities.div(10 ** 8).toString()} CKB`))
```

Maybe you'll get an output like this
```
address: <your-address>
balance: 0 CKB
```

### 4. Pick up some CKB from the test net faucet

It looks like we don't have any CKB yet, don't feel bad, faucet can give me some ckb, click [here](https://faucet.nervos.org/) to access

![faucet](https://user-images.githubusercontent.com/22258327/188526028-93e26b00-c79d-4e17-b2d5-1b1c8b8071bb.png)

You may see a page like this, now fill in the address we generated before into the middle input box and click the Claim button, then you will see an additional piece of data in the page like this

![after-claim](https://user-images.githubusercontent.com/22258327/188526096-fd1e91bb-4f83-4c95-aed1-8b054e350d0d.png)

After waiting about 10s, the status of this data will change from Pending to Processed, so let's run our wallet project again and check our balance
```
address: <your-address>
balance: 10000 CKB
```

Our wallet is working fine, we have a CKB now, but just checking the balance is useless, we still need to upgrade to support sending transactions.

### 5. Create a transfer transaction

Suppose bob is a pizzeria and you have ordered a pizza from bob with 100 CKB and now need to pay bob for the 100 ckb, bob tells you his address is:  `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f`

`@ckb-lumos` provides some common methods, we can use it to help build this transaction

``` ts
import { helpers, commons } from '@ckb-lumos/lumos';

let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
txSkeleton = await commons.common.transfer(
    txSkeleton,
    ['<your-address>'],
    'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f',
    BigInt(100 * 10 ** 8),
);
```

Now that we have build a base transaction, and in order for this transaction to be successfully packaged on the chain, we also need to pay some fees to the miner.

Fee are calculated by the size of the transaction. And lumos provides the `payFeeByFeeRate` method to help pay fee

``` ts
import { helpers, commons } from '@ckb-lumos/lumos';

txSkeleton = await commons.common.payFeeByFeeRate(
  txSkeleton,
  ['<your-address>'],
  1000,
);
```

We have build a transfer transaction, to make sure it's ok, we need to sign the transaction

``` ts
import { BI, hd, config, helpers, RPC, Indexer, commons } from '@ckb-lumos/lumos';

txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
const message = txSkeleton.get("signingEntries").get(0)?.message;
const Sig = hd.key.signRecoverable(message!, privateKey);
const tx = helpers.sealTransaction(txSkeleton, [Sig]);

const txHash = await rpc.sendTransaction(tx, "passthrough");
console.log(`txHash is: ${txHash}`)
```

Let's run the transfer function and we'll see an output like `txHash is: 0x998dd1ec986ad0f1aff5f527dc3e9fe13cba0d20ee2e7ee0ce83af213cd399c4`, let's go to [block explorer](https ://pudge.explorer.nervos.org/) to look up the transaction

![example](https://user-images.githubusercontent.com/22258327/188527969-0e7b81e0-8c5f-42f8-8278-0b73d81ee7de.png)

We can see that the transaction did consume a 10000ckb cell and generated a 100ckb cell for bob as well as generated change for itself

Congratulations, you can now lie on the couch waiting to enjoy a delicious pizza!


<details>
<summary>Complete sample code, click to expand</summary>

```ts title="wallet.ts"
import { BI, hd, config, helpers, RPC, Indexer, commons, Address, HexString } from '@ckb-lumos/lumos';
const { mnemonic, ExtendedPrivateKey } = hd;

config.initializeConfig(config.predefined.AGGRON4);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export const generatePrivateKey = () => {
  const m = mnemonic.generateMnemonic()
  const seed = mnemonic.mnemonicToSeedSync(m)
  return ExtendedPrivateKey.fromSeed(seed).privateKey
}

const getAddressByPrivateKey = (privateKey: string) => {
  const args = hd.key.privateKeyToBlake160(privateKey);
  const template = config.predefined.AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };

  return helpers.encodeToAddress(lockScript);
}

export async function getCapacities(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let capacities = BI.from(0);
  for await (const cell of collector.collect()) {
    capacities = capacities.add(cell.cellOutput.capacity);
  }

  return capacities;
}

const transfer = async(from: Address, to: Address, capacity: number, privateKey: HexString) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [from],
    to,
    BigInt(capacity),
  );
  
  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [from],
    1000,
  );
  
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  return rpc.sendTransaction(tx, "passthrough");
}

// input your privateKey or generate a new privateKey
const privateKey = `0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3`
const address = getAddressByPrivateKey(privateKey);
const bobAddress = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f'

console.log('address: ', address)
getCapacities(address).then(capacities => console.log(`balance: ${capacities.div(10 ** 8).toString()} CKB`))
transfer(address, bobAddress, 100 * 10 ** 8, privateKey).then((txHash: string) => console.log('txHash: ', txHash));
```

</details>

# Advance: Upgrade wallet for support Token (like ERC20)

In the last section we created a simple wallet to view CKB balance and transfer CKB, in this section we will upgrade the wallet to support Token viewing and transfer, here are some of the features to be implemented

 - Issue a new Token
 - Transfer Token to Alice
 - Check Alice's Token balance


Token is a similar to ERC20 in the ethereum ecosystem. The token in ckb is called Sudt (Simple User Defined Token), and the data structure for storing Sudt cell looks like this.

```
capacity:
    ckb amount
data:
    udt amount (uint128)
type:
    code_hash:
        sudt code hash
    args:
        issuer lock hash
lock:
    user defined
```

## Issue a new Token

Run the following command to create a new file.

``` shell
touch sudt-wallet.ts
```

First set up the lumos as before

```ts
import { config } from '@ckb-lumos/lumos';

config.initializeConfig(config.predefined.AGGRON4);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
```

`@ckb-lumos/common-scripts` provides some simple functions to help us build an issue transaction

```ts
const issueToken = async (issuer: Address, amount: number, privateKey: string) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.sudt.issueToken(
    txSkeleton,
    issuer,
    amount,
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [issuer],
    1000,
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  return rpc.sendTransaction(tx, "passthrough");
}
```

Let's add a few logs and run the code

```ts
const privateKey = '0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3';
issueToken(getAddressByPrivateKey(privateKey), 1000, privateKey).then((txHash: string) => console.log('txHash: ', txHash));
```

We can get an output like this, search it in explorer and indeed find sudt have issued
```
txHash:  0x53dbf57c44938bc95cb3e33a0ac10ce5c3c37e88224ea2e785a6499ac4ca1c4d
```

![sudt-transaction](https://user-images.githubusercontent.com/22258327/188768143-65dd83c9-4a93-4b3c-9472-c4be8063231f.png)


## Transfer Token to Alice
:::info
Suppose the address of alice is `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2x0z0rmc44ek25rmdk7dky5wnhdlrmqncyhcvkp`
:::

`@ckb-lumos/common-scripts` also provides some simple functions to help transfer sudt

``` ts
export const transferToken = async (issuer: Address, to: Address, amount: number, privateKey: string) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  const scriptLockHash = utils.computeScriptHash(helpers.parseAddress(issuer))

  txSkeleton = await commons.sudt.transfer(
    txSkeleton,
    [issuer],
    scriptLockHash,
    to,
    BI.from(amount),
  )

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [issuer],
    1000,
  );
  
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  return rpc.sendTransaction(tx, "passthrough");
}
```

run this code
```ts
// change to yours privateKey
const privateKey = '0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3';
const aliceAddress = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2x0z0rmc44ek25rmdk7dky5wnhdlrmqncyhcvkp';
transferToken(getAddressByPrivateKey(privateKey), aliceAddress, 10, privateKey).then((txHash: string) => console.log('txHash: ', txHash));
```

We can get an output like this, search the explorer, and indeed transferring 10 usdt to alice's account
```
txHash:  0xbccac791e1eb4e005d0f8208c9cb3178af046f814fa1c01c2b5f3f6a966c3486
```
 
## Check Alice's Token balance
Get token amount is also finding the cell where the token is stored, but unlike finding the ckb capacities, each sudt has a type script, and the amount of the token is stored in data instead of capacity

```ts
export const getTokenAmount = async (address: Address, sudtArgs: string) => {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
    type: {
      codeHash: config.predefined.AGGRON4.SCRIPTS['SUDT'].CODE_HASH,
      hashType: config.predefined.AGGRON4.SCRIPTS['SUDT'].HASH_TYPE,
      args: sudtArgs,
    }
  });

  let amount = BI.from(0);
  for await (const cell of collector.collect()) {
    amount = amount.add(number.Uint128LE.unpack(cell.data));
  }

  return amount;
}
```
Let's run it and see how many sudt's alice has

:::tip
The args of SUDT are the lock script hash of the token issuer, and we can use the built-in utils library in `Lumos` to help us calculate the hash
:::

```ts
import { utils } from '@ckb-lumos/lumos';
const privateKey = '0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3';
const issuerAddress = getAddressByPrivateKey(privateKey);
const aliceAddress = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2x0z0rmc44ek25rmdk7dky5wnhdlrmqncyhcvkp';

const scriptLockHash = utils.computeScriptHash(helpers.parseAddress(issuerAddress))
getTokenAmount(aliceAddress, scriptLockHash).then((v) => {console.log('sudt balance:', v.toString())})

```

We can get an output like this, which is the 10 sudt we just transferred to alice
```
sudt balance: 10
```

So we have successfully added the functions of issue SUDT/transfer SUDT/check SUDT balance to the wallet


<details>
<summary>Complete sample code, click to expand</summary>

```ts title="sudt-wallet.ts"
import { config, Address, RPC, Indexer, helpers, commons, hd, BI, utils } from '@ckb-lumos/lumos';
import { number } from "@ckb-lumos/codec";

config.initializeConfig(config.predefined.AGGRON4);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export const issueToken = async (issuer: Address, amount: number, privateKey: string) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.sudt.issueToken(
    txSkeleton,
    issuer,
    amount,
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [issuer],
    1000,
  );
  
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  return rpc.sendTransaction(tx, "passthrough");
}


export const transferToken = async (issuer: Address, to: Address, amount: number, privateKey: string) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  const scriptLockHash = utils.computeScriptHash(helpers.parseAddress(issuer))

  txSkeleton = await commons.sudt.transfer(
    txSkeleton,
    [issuer],
    scriptLockHash,
    to,
    BI.from(amount),
  )

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [issuer],
    1000,
  );
  
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);

  return rpc.sendTransaction(tx, "passthrough");
}

export const getTokenAmount = async (address: Address, sudtArgs: string) => {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
    type: {
      codeHash: config.predefined.AGGRON4.SCRIPTS['SUDT'].CODE_HASH,
      hashType: config.predefined.AGGRON4.SCRIPTS['SUDT'].HASH_TYPE,
      args: sudtArgs,
    }
  });

  let amount = BI.from(0);
  for await (const cell of collector.collect()) {
    amount = amount.add(number.Uint128LE.unpack(cell.data));
  }

  return amount;
}
```
</details>
