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

The code in this tutorial is written in TypeScript,
so it is recommended to use a CLI tool that supports running TypeScript directly without transpiling, such as [Bun](https://bun.sh/).

### Create Project Directory and Initialize

```sh
mkdir xudt-from-scratch
cd xudt-from-scratch
bun init -y
# try running the ts file created by default
bun index.ts
# based on the @ckb-lumos/lumos@0.0.0-canary-84521a5-20240530061434
bun install @ckb-lumos/lumos@canary
```

### Generate a Private Key

We'll need a private key to act as the owner of the minted xUDT. Run the following command to generate a random private key:

```shell
openssl rand -hex 32
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

## Mint with Extension Script

xUDT introduces a new way to mint token.
The new way allows the owner script as an extension script in the witness instead of in the `inputs`.
This is useful to avoid cell congestion, so users are able to mint tokens in parallel.
The mint transaction structure looks like this:

```yaml
inputs:
  - capacity_provider_cell:
      lock: unlimited
outputs:
  - capacity_change_cell:
      lock: unlimited
  - minted_cell:
      lock: receiver_lock
      type:
        code_hash: xudt_code_hash
        type: xudt_type
        args: owner_lock_code_hash(32 bytes)
      data: xudt_amount_u128
witnesses:
  - witness_args:
      output_type: owner_script
```

```ts
async function mintViaExtensionScript() {
  // An always-success extension script.
  // You can compile it yourself from https://github.com/nervosnetwork/ckb-production-scripts/blob/410b16c499a8888781d9ab03160eeef93182d8e6/tests/xudt_rce/extension_script_0.c
  // we use the script to demonstrate how to use Lumos to mint xUDT with the extension script
  const ALWAYS_SUCCESS_EXTENSION: ScriptConfig = {
    CODE_HASH: "0xea8ee0b1e932802224f6462f57b34110907357ac35d0952383d550820e1205d1",
    HASH_TYPE: "type",
    TX_HASH: "0x5681d80387af77a096aa1386dbe3ba7b44a3302e62cc0f832ea51869bc5a614c",
    INDEX: "0x0",
    DEP_TYPE: "code",
  }

  // Reuse the owner defined above
  const receiverLock = ownerLockScript
  const receiverAddress = encodeToAddress(receiverLock)

  // 🌟 1. Define the schema for extension script
  // https://github.com/nervosnetwork/ckb-production-scripts/blob/410b16c499a8888781d9ab03160eeef93182d8e6/c/xudt_rce.mol#L3-L11
  const ScriptVec = vector(blockchain.Script)
  const ScriptVecOpt = option(ScriptVec)
  const XudtWitnessInput = table(
    {
      ownerScript: blockchain.ScriptOpt,
      ownerSignature: blockchain.BytesOpt,
      rawExtensionData: ScriptVecOpt,
      extensionData: blockchain.BytesVec,
    },
    ["ownerScript", "ownerSignature", "rawExtensionData", "extensionData"]
  )

  // 🌟2. Create the Owner Lock Script
  // The owner script will be set into witness instead of inputs
  const extensionOwnerScript = createScript(ALWAYS_SUCCESS_EXTENSION, "0x")

  // 🌟3. Create the xUDT Type Script
  const xudtTypeScript = createScript(XUDT, computeScriptHash(extensionOwnerScript))

  // 4. Create Minted Cell with Amount
  const mintCell: Cell = cellHelper.create({
    lock: receiverLock,
    type: xudtTypeScript,
    data: Uint128.pack(10000),
  })

  // 5. Create Transaction Skeleton
  const cellProvider: TransactionSkeletonType["cellProvider"] = {
    collector: (query) => indexer.collector({ type: "empty", data: "0x", ...query }),
  }
  let txSkeleton = TransactionSkeleton({ cellProvider })

  // 6. Add xUDT Script and Owner Extension Script Dependency
  txSkeleton = addCellDep(txSkeleton, createCellDep(XUDT))
  txSkeleton = addCellDep(txSkeleton, createCellDep(ALWAYS_SUCCESS_EXTENSION))

  // 7. Inject Capacity for Minted Cell
  txSkeleton = await common.injectCapacity(txSkeleton, [receiverAddress], mintCell.cellOutput.capacity)

  // 8. Add Minted Cell to Outputs
  txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(mintCell))

  // 🌟9. Set the Extension Owner Script into witnesses
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    const witnessOutputType = XudtWitnessInput.pack({ ownerScript: extensionOwnerScript, extensionData: [] })
    const mintCellIndex = txSkeleton.get("outputs").size - 1
    return witnesses.set(mintCellIndex, hexify(WitnessArgs.pack({ outputType: witnessOutputType })))
  })

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

You can check the [mint via extension script example](https://pudge.explorer.nervos.org/transaction/0x2118ad6e7d1e56a2f295f1d0f9e8718c457b9e76282e651ce7abb40fef249b2d) in the explorer.
