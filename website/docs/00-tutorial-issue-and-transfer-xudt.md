---
title: "Tutorial: Mint and Transfer xUDT From Scratch"
sidebar_position: 1
---

# Tutorial: Mint and Transfer xUDT From Scratch

Extensible User Defined Token ([xUDT](https://blog.cryptape.com/enhance-sudts-programmability-with-xudt)) is a programmable token standard on the CKB blockchain. This tutorial guides you through creating and transferring xUDT tokens from scratch.

## Pre-requirement

- Basic TypeScript syntax knowledge, including defining variables with type declaration
- Basic CKB knowledge, including Cell and RPC

### Initialize Project

We'll use [Bun](https://bun.sh/), a lightweight runtime environment compatible with Node.js and TypeScript. It allows you to run the code directly without transpiling. Alternatively, you can use [ts-node](https://github.com/TypeStrong/ts-node) with Node.js

```shell
bun --version
#> 1.1.12
```

### Create Project Directory and Initialize

```sh
mkdir xudt-from-scratch
cd xudt-from-scratch
bun init -y

# based on the @ckb-lumos/lumos@0.0.0-canary-84521a5-20240530061434
npm install @ckb-lumos/lumos@canary
```

This will create a basic project structure with necessary files.

### Generate a Private Key

We'll need a private key to act as the owner of the minted xUDT. Run the following command to generate a random private key:

```shell
bun -e "console.log('0x'+require('crypto').randomBytes(32).toString('hex'))"
```

Save the displayed key. You'll need it later.

### Setup `index.ts`

Let's set up the demo for configuration and importing library used later

```ts
import type { Cell, Script, CellDep } from "@ckb-lumos/lumos"
import { config, hd, Indexer, RPC } from "@ckb-lumos/lumos"
import { bytes, BytesLike, Uint128 } from "@ckb-lumos/lumos/codec"
import { common } from "@ckb-lumos/lumos/common-scripts"
import { ScriptConfig } from "@ckb-lumos/lumos/config"
import { addCellDep, cellHelper, encodeToAddress, sealTransaction, TransactionSkeleton } from "@ckb-lumos/lumos/helpers"
import { computeScriptHash } from "@ckb-lumos/lumos/utils"

// to work with the testnet
config.initializeConfig(config.TESTNET)
// indexer for cell provider
const indexer = new Indexer("https://testnet.ckb.dev")
// rpc to interact with the CKB node
const rpc = new RPC("https://testnet.ckb.dev")

// paste the generated key for the owner
const ownerPrivateKey = "<0x paste the key here>"

// script config that will be used later
const { XUDT, SECP256K1_BLAKE160 } = config.TESTNET.SCRIPTS

const ownerLockScript = createScript(SECP256K1_BLAKE160, hd.key.privateKeyToBlake160(ownerPrivateKey))
const ownerAddress = encodeToAddress(ownerLockScript)

// a helper to create a Script from a ScriptConfig
function createScript(config: ScriptConfig, args: BytesLike): Script {
  return { codeHash: config.CODE_HASH, hashType: config.HASH_TYPE, args: bytes.hexify(args) }
}

// a helper to crete a CellDep from a ScriptConfig
function createCellDep(config: ScriptConfig): CellDep {
  return { depType: config.DEP_TYPE, outPoint: { txHash: config.TX_HASH, index: config.INDEX } }
}
```

## Mint

To mint xUDT, a lock script is required to be treated an owner, and the xUDT can be minted when the owner script in the `inputs` (or in the `witness.outputType`).

The mint transaction is like the following

```yaml
inputs:
  - owner:
      lock: unlimited
outputs:
  - minted_cell:
      lock: receiver_lock
      type:
        code_hash: xudt_code_hash
        type: xudt_type
        args: owner_lock_code_hash(32 bytes)
      data: xudt_amount_u128
  - owner_change_cell
```

Let's start coding to build the above mint transaction

```ts
async function mint() {
  console.log("Please Claim some testnet CKB first from https://faucet.nervos.org")
  console.log("Your owner address:", ownerAddress)

  // 1. Create the xUDT Type Script
  // This script defines the structure of the xUDT token.
  const xudtTypeScript = createScript(XUDT, computeScriptHash(ownerLockScript))

  // 2. Define Cell Provider (Optional)
  // This helps filter out unnecessary cells during transaction building.
  const cellProvider: TransactionSkeletonType["cellProvider"] = {
    collector: (query) => indexer.collector({ type: "empty", data: "0x", ...query }),
  }

  // 3. Create Transaction Skeleton
  // This is the base structure for our transaction.
  let txSkeleton = TransactionSkeleton({ cellProvider })

  // 4. Create Minted Cell with Amount
  // This defines the cell that will hold the minted xUDT tokens.
  const mintCell = cellHelper.create({
    lock: ownerLockScript, // The owner (you) controls this cell.
    type: xudtTypeScript, // This cell holds xUDT tokens.
    data: Uint128.pack(10000), // Set the initial amount of xUDT to mint (10000).
  })

  // 5. Add xUDT Script Dependency
  txSkeleton = addCellDep(txSkeleton, createCellDep(XUDT))

  // 6. Inject Capacity for Minted Cell
  txSkeleton = await common.injectCapacity(txSkeleton, [ownerAddress], mintCell.cellOutput.capacity)

  // 7. Add Minted Cell to Outputs
  // Specify the minted cell as part of the transaction outputs.
  txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(mintCell))

  // 8. Pay Transaction Fee
  // Allocate CKB for transaction fees.
  // see also https://github.com/nervosnetwork/ckb/blob/31e02872b3a55ca7558073cb781971d8bc8f29b2/util/app-config/src/legacy/tx_pool.rs#L8-L9
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [ownerAddress], 1000)

  // 9. Prepare Signing Entries and Sign
  // Prepare transaction data for signing and sign it with your private key.
  txSkeleton = common.prepareSigningEntries(txSkeleton)
  const signatures = txSkeleton
    .get("signingEntries")
    .map(({ message }) => hd.key.signRecoverable(message, ownerPrivateKey))
    .toArray()

  // 10. Broadcast Transaction
  // Send the signed transaction to the CKB node.
  const signedTransaction = sealTransaction(txSkeleton, signatures)
  const txHash = await rpc.sendTransaction(signedTransaction)
  console.log(`https://pudge.explorer.nervos.org/transaction/${txHash}`)
}
```

After broadcasting successfully, the transaction can be found in the explorer,
and here is a [mint example](https://pudge.explorer.nervos.org/transaction/0x4467a0e8179b2044b2cf1aaa6f0b4d375f38b625519c174bee9cc73b28cce6e0) on the CKB testnet explorer

## Transfer

Let's transfer the minted xUDT cell to Alice. The transaction is also pretty straightforward

```yaml
inputs:
  - minted_cell:
      lock: owner_lock
      type: xudt
      data: amount
  - fee_cell:
      lock: unlimited
outputs:
  - minted_cell:
      lock: alice
      type: xudt
      data: amount
  - fee_cell_change:
      lock: unlimited
```

```ts
async function transfer() {
  const xudtTypeScript = createScript(XUDT, computeScriptHash(ownerLockScript))

  const cellProvider: TransactionSkeletonType["cellProvider"] = {
    collector: (query) => indexer.collector({ type: "empty", data: "0x", ...query }),
  }

  const alicePrivateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  const aliceLock = createScript(SECP256K1_BLAKE160, hd.key.privateKeyToBlake160(alicePrivateKey))

  // 1. Collect Minted xUDT Cell
  // Find the xUDT cell owned by you (based on owner lock script).
  const xudtCollector = indexer.collector({ type: xudtTypeScript, lock: ownerLockScript })

  let transferCell: Cell | undefined

  for await (const cell of xudtCollector.collect()) {
    transferCell = cell
    // Collect only one (assuming you have only one minted xUDT cell).
    break
  }

  if (!transferCell) {
    throw new Error("Owner do not have an xUDT cell yet, please call mint first")
  }

  const transferAmount = Uint128.unpack(transferCell.data)
  console.log("Transfer to Alice", transferAmount.toNumber(), "xUDT")

  // 2. Create Transaction Skeleton
  let txSkeleton = TransactionSkeleton({ cellProvider })

  // 3. Add xUDT Script Dependency
  txSkeleton = addCellDep(txSkeleton, createCellDep(XUDT))

  // 4. Set Up Input Cell (Transfer Cell)
  // Include the minted xUDT cell as both input and output (for transfer).
  txSkeleton = await common.setupInputCell(txSkeleton, transferCell)

  // 5. Update Output Cell Lock to Alice's Lock
  // Change the ownership of the minted xUDT cell to Alice's lock.
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.update(0, (cell) => ({ ...cell!, cellOutput: { ...cell!.cellOutput, lock: aliceLock } }))
  )

  // the following process is the same with mint to broadcast the transaction
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [ownerAddress], 1000)
  txSkeleton = common.prepareSigningEntries(txSkeleton)

  const signatures = txSkeleton
    .get("signingEntries")
    .map(({ message }) => hd.key.signRecoverable(message, ownerPrivateKey))
    .toArray()

  const signed = sealTransaction(txSkeleton, signatures)
  const txHash = await rpc.sendTransaction(signed)
  console.log(txHash)
}
```

Here is the [transfer example](https://pudge.explorer.nervos.org/transaction/0xc00d5c18cecf7b436ebc8735961d8c9b383f56ceb03d6b0dcc5e43e4eebd4341) in the explorer
