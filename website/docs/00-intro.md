---
slug: /
sidebar_position: 1
---

# Tutorial

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this tutorial, we will develop a simple HD wallet to help manage assets on CKB. And we need to implement some logic that most wallets have

 - Generate private key and address
 - Check CKB balance
 - Transfer CKB to other address

This simple example can help to understand how to develop CKB dapp with `Lumos`.

### 1. Create a new Lumos project
We'll install Lumos using the Node.js package manager (npm), which is both a package manager and an online repository for JavaScript code.
:::tip
You can get [help](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) if you don't have Node.js, 
:::

You can use other package managers in Node.js, but we recommend to use npm to follow this tutorial.

Open a new terminal and run these commands to create a new folder:
``` shell
mkdir lumos-tutorial
cd lumos-tutorial
```

Then initialize an npm project as shown below. You will be prompted to answer some questions.

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
For a wallet, the most important and commonly used function is view account. This tutorial generates private key and address by `@ckb-lumos/hd`

:::tip
If you don't know much about HD Wallet, this [article](https://learnmeabitcoin.com/technical/hd-wallets) has a very good explanation
:::

Create the `wallet.ts` file in the root directory

``` ts
// wallet.ts
import { hd } from '@ckb-lumos/lumos';
const { mnemonic, ExtendedPrivateKey,AddressType } = hd;

export const generateFirstHDPrivateKey = () => {
  const myMnemonic = mnemonic.generateMnemonic();
  const seed = mnemonic.mnemonicToSeedSync(myMnemonic);
  console.log("my mnemonic ", seed);

  const extendedPrivKey = ExtendedPrivateKey.fromSeed(seed);
  return extendedPrivKey.privateKeyInfo(AddressType.Receiving, 0).privateKey;
}
```

CKB has the testnet `Arggon` and the mainnet `Lina`, `Lumos` can work on different environment.

lumos has a `config` module to help us manage the config of the different envrioment

``` ts
import { config } from '@ckb-lumos/lumos';

// this tutorial will use the testnet.
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

Now we can try to run this code

:::caution
When you generate a private key, keep it in a safe place and do not disclose it to anyone, otherwise the asset may not be unlocked or lost.
:::

``` ts
const privateKey = generateFirstHDPrivateKey()
const address = getAddressByPrivateKey(privateKey);
console.log('privateKey: ', privateKey)
console.log('address: ', address)
```

Maybe you'll get an output like this, save the privateKey and keep it in a safe place
```
// it's a sample print, dont use this sample account directly.
privateKey: 0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3
address:  ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0820lwy5m5uqnhpap2h0kms9ta3u3pp2ss889v4
```


### 3. Check CKB Balance
In the previous section we generated account, but for a wallet it's not enough, we need to know how much CKB balance we have


CKB provides a rpc for searching on-chain data, but many on-chain data are very troublesome to index. so CKB also provides an indexer rpc to help searching easily.


<details>
<summary>Available public PRC</summary>

Mainnet(Lina)

- CKB Node RPC
    - mainnet.ckbapp.dev
- CKB Indexer RPC
    - mainnet.ckbapp.dev/indexer
- Mercury RPC
    - mercury-mainnet.ckbapp.dev

Testnet(Aggron)

- CKB Node RPC
    - testnet.ckbapp.dev
    - testnetrpc.ckb.dev
- CKB Indexer RPC
    - testnet.ckbapp.dev
    - testnetrpc.ckbapp.dev/indexer
- Mercury RPC
    - mercury-testnet.ckbapp.dev

</details>

``` ts
import { RPC, Indexer } from '@ckb-lumos/lumos';

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
```

In CKB, UTXO is called `Cell`, and the CKB balance as the capacity field of `Cell`, when we want to know how much balance we have, we need to find all our Cells

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
// write this at the end of previous wallet.ts file
console.log(`address: ${address}`)
getCapacities(address).then(capacities => console.log(`balance: ${capacities.div(10 ** 8).toString()} CKB`))
```

:::tip
can use `npx ts-node wallet.ts` command to run it
:::

Maybe you'll get an output like this
```
address: <your-address>
balance: 0 CKB
```

### 4. Claim CKB from the test net faucet

It looks like we don't have any CKB yet, don't feel bad, faucet can give us some CKB, click [here](https://faucet.nervos.org/) to access

![faucet](https://user-images.githubusercontent.com/22258327/188526028-93e26b00-c79d-4e17-b2d5-1b1c8b8071bb.png)

Input address to the middle input box and click the Claim button, then you will see an additional data in the page

![after-claim](https://user-images.githubusercontent.com/22258327/188526096-fd1e91bb-4f83-4c95-aed1-8b054e350d0d.png)

Waiting about 10s, the status of this data will change from Pending to Processed, so let's run wallet again and check balance
```
address: <your-address>
balance: 10000 CKB
```

### 5. Create a transfer transaction

Suppose bob is a pizzeria and you have ordered a pizza from bob with 100 CKB and now need to pay bob for the 100 CKB, bob tells you his address is:  `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgy5rtexzvhk7jt7gla8wlq5lztf79tjhg9fmd4f`

We can upgrade the wallet to support transfer

`@ckb-lumos` provides some common methods to help build this transaction

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

Now that we have build a base transaction, but in order for this transaction to be successfully sent to the chain, we need to pay some fees to the miner.

Fee are calculated by the size of the transaction. And lumos provides the `payFeeByFeeRate` method to help pay fee

``` ts
import { helpers, commons } from '@ckb-lumos/lumos';

txSkeleton = await commons.common.payFeeByFeeRate(
  txSkeleton,
  ['<your-address>'],
  1000,
);
```

Finally we need to sign the transaction

``` ts
import { BI, hd, config, helpers, RPC, Indexer, commons } from '@ckb-lumos/lumos';

txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
const message = txSkeleton.get("signingEntries").get(0)?.message;
const Sig = hd.key.signRecoverable(message!, privateKey);
const tx = helpers.sealTransaction(txSkeleton, [Sig]);

const txHash = await rpc.sendTransaction(tx, "passthrough");
console.log(`txHash is: ${txHash}`)
```

Let's run the transfer function and we'll see an output like `txHash is: 0x998dd1ec986ad0f1aff5f527dc3e9fe13cba0d20ee2e7ee0ce83af213cd399c4`, let's go to [block explorer](https://pudge.explorer.nervos.org/) to look up the transaction

![example](https://user-images.githubusercontent.com/22258327/188527969-0e7b81e0-8c5f-42f8-8278-0b73d81ee7de.png)

We can see this transaction did consume a 10000CKB cell and generated a 100CKB cell for bob as well as generated change for itself

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

export const generateFirstHDPrivateKey = () => {
  const m = mnemonic.generateMnemonic()
  const seed = mnemonic.mnemonicToSeedSync(m)
  console.log('my mnemonic ', seed);
  
  
  const extendedPrivKey = ExtendedPrivateKey.fromSeed(seed);
  return extendedPrivKey.privateKeyInfo(
    AddressType.Receving,
    0,
  ).privateKey
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


Token is a similar to ERC20 in the ethereum ecosystem. The token in CKB is called SUDT (Simple User Defined Token), and the data structure for storing SUDT cell looks like this.

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

First set up the lumos

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

We can get an output like this, search it in [explorer](https://pudge.explorer.nervos.org/) and indeed find SUDT have issued
```
txHash:  0x53dbf57c44938bc95cb3e33a0ac10ce5c3c37e88224ea2e785a6499ac4ca1c4d
```

![sudt-transaction](https://user-images.githubusercontent.com/22258327/188768143-65dd83c9-4a93-4b3c-9472-c4be8063231f.png)


## Transfer Token to Alice
:::info
Suppose the alice's address is `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2x0z0rmc44ek25rmdk7dky5wnhdlrmqncyhcvkp`
:::

`@ckb-lumos/common-scripts` also provides some simple functions to help transfer SUDT

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

We can get an output like this, search txHash in [explorer](https://pudge.explorer.nervos.org/), and indeed transferring 10 SUDT to alice
```
txHash:  0xbccac791e1eb4e005d0f8208c9cb3178af046f814fa1c01c2b5f3f6a966c3486
```
 
## Check Alice's Token balance
Getting Token amount is also finding Cells, but unlike CKB capacities, each SUDT has a type script, and number of Token is stored in the data field, not the capacity field

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
Let's run it and see how many SUDTs alice has

:::tip
The args of SUDT are the lock script hash of the token issuer, and we can use the built-in utils library in `Lumos` to help us calculate the hash
:::

```ts
import { utils } from '@ckb-lumos/lumos';
const privateKey = '0x9ab62c912c48d615a030318af514758e8c7b9f03d37a95dd1b89e775b669e0c3';
const issuerAddress = getAddressByPrivateKey(privateKey);
const aliceAddress = 'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2x0z0rmc44ek25rmdk7dky5wnhdlrmqncyhcvkp';

const scriptLockHash = utils.computeScriptHash(helpers.parseAddress(issuerAddress))
getTokenAmount(aliceAddress, scriptLockHash).then((v) => {console.log('SUDT balance:', v.toString())})

```

We can get an output like this, which is the 10 SUDT we just transferred to alice
```
SUDT balance: 10
```

So we have successfully added the functions of issue SUDT / transfer SUDT / check SUDT balance to the wallet


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
