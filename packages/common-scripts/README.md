# `@ckb-lumos/common-scripts`

Common script implementation for lumos. Includes `secp256k1_blake2b` lock script, `secp256k1_blake160_multisig` lock script, `dao` type script, `sudt` type script now.

`LocktimePool` script includes `secp256k1_blake160_multisig` cells which with locktime in lock `args` (which `args` total length is 28 bytes, last 8 bytes is a `since` format locktime in BigUInt64LE encode) and `DAO` step2 cells.

`common` script allows you to `transfer` capacity from `fromInfos` to an address. It will use locktime pool cells first by default.

`deploy` script provides `generateDeployWithDataTx`, `generateDeployWithTypeIdTx` and `generateUpgradeTypeIdDataTx`, these generators help in the process of deploying contracts.

## Usage

`common` script support new lock scripts provided by user, and [`pw-lock`](./examples/pw_lock/lock.ts) shows how to do it.

Following script will show how to use `common` script to transfer capacity to another address. `secp256k1_blake160`, `secp256k1_blake160_multisig` and `locktime_pool` script are similar to `common`, and `common` maybe a better choose.

```javascript
const { common } = require('@ckb-lumos/common-scripts');
const { sealTransaction } = require("@ckb-lumos/helpers")
const { Indexer } = require("@ckb-lumos/indexer")

// We can use Indexer module as cell provider
const indexer = new Indexer("http://127.0.0.1:8114", "./indexer-data");

const tipHeader = {
  compact_target: '0x20010000',
  dao: '0x49bfb20771031d556c8480d47f2a290059f0ac7e383b6509006f4a772ed50200',
  epoch: '0xa0006002b18',
  hash: '0x432451e23c26f45eaceeedcc261764d6485ea5c9a204ac55ad755bb8dec9a079',
  nonce: '0x8199548f8a5ac7a0f0caef1620f37b79',
  number: '0x1aef6',
  parent_hash: '0x63594a64108f19f6aed53d0dca9ab4075aac4379cb80b2097b0deac8fc16fd3b',
  proposals_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  timestamp: '0x172f6b9a4cf',
  transactions_root: '0x282dbadcd49f3e229d997875f37f4e4f19cb4f04fcf762e9639145aaa667b6f8',
  uncles_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  version: '0x0'
}

const fromInfos = [
  "ckb1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gq5f9mxs",
  {
    R: 0,
    M: 1,
    publicKeyHashes: ["0x36c329ed630d6ce750712a477543672adab57f4c"],
  },
]

let txSkeleton = TransactionSkeleton({ cellProvider: indexer })

// If using secp256k1_blake160_multisig lock script, put MultisigScript to `fromInfos` for generate signing messages.
// By default, `common.transfer` will use cells with locktime firstly. `tipHeader` is required when you want to spent cells with locktime.
txSkeleton = await common.transfer(
  txSkeleton,
  fromInfos,
  "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd",
  BigInt(3500 * 10 ** 8),
  tipHeader,
)

// Or you want to use cells without locktime firstly.
txSkeleton = await common.transfer(
  txSkeleton,
  fromInfos,
  "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd",
  BigInt(3500 * 10 ** 8),
  tipHeader,
  { useLocktimeCellsFirst: false }
)

// When you want to pay fee for transaction, just call `payFee`.
txSkeleton = await common.payFee(
  txSkeleton,
  fromInfos,
  BigInt(1*10**8),
  tipHeader,
)

// `prepareSigningEntries` will generate message for signing.
// Signing messages will fill in `txSkeleton.signingEntries`.
txSkeleton = await common.prepareSigningEntries(
  txSkeleton
)

// Then you can sign messages in order and get contents.
// NOTE: lumos not provided tools for generate signatures now.
// Call `sealTransaction` to get a transaction.
const tx = sealTransaction(txSkeleton, contents)

// Then you can send tx to a CKB node via RPC `send_transaction`.
```

Following script will show how to use `DAO` script.

```javascript
const { dao } = require("@ckb-lumos/common-scripts")

let txSkeleton = TransactionSkeleton({ cellProvider: indexer })

// First, deposit capacity to dao.
txSkeleton = await dao.deposit(
  txSkeleton,
  "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd", // will gather inputs from this address.
  "ckb1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gq5f9mxs", // will generate a dao cell with lock of this address.
  BigInt(1000*10**8),
)

// Using `listDaoCells` to list all deposited cells.
const daoDepositedCells = await dao.listDaoCells(
  indexer,
  "ckb1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gq5f9mxs",
  "deposit",
)

// Or using `CellCollector`
const daoDepositedCellCollector = new dao.CellCollector(
  "ckb1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gq5f9mxs",
  indexer,
  "deposit",
)

for await (const inputCell of daoDepositedCellCollector.collect()) {
  console.log(inputCell)
}

// And pick one to withdraw.
// `fromInfo` only required for multisig script.
txSkeleton = await dao.withdraw(
  txSkeleton,
  daoDepositedCells[0],
)

// Then if want to unlock dao withdrew cells, just use `common.transfer`.
```

Following script will show how to use `sUDT` script.

```javascript
const { sudt } = require("@ckb-lumos/common-scripts")
let txSkeleton = TransactionSkeleton({ cellProvider: indexer })

// issue an sudt token, will use the second param address to generate sudt token(it's lock hash).
txSkeleton = await sudt.issueToken(
  txSkeleton,
  "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd",
  10000n,
);

// and transfer sUDT
const sudtToken = "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d"
txSkeleton = await sudt.transfer(
  txSkeleton,
  ["ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd"],
  sudtToken,
  "ckb1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gq5f9mxs",
  1000n,
  "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd",
);
```

Following script will show how to use `deploy` script.
```javascript
const { generateDeployWithDataTx, generateDeployWithTypeIdTx, generateUpgradeTypeIdDataTx, payFee } = require("@ckb-lumos/common-scripts");
const { Indexer } = require("@ckb-lumos/ckb-indexer");
const { initializeConfig, predefined } = require("@ckb-lumos/config-manager");
const { parseAddress } = require("@ckb-lumos/helpers");

initializeConfig(predefined.AGGRON4);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const indexer = new CkbIndexer(CKB_INDEXER_URL, CKB_RPC_URL);

const address = "ckt1qyqptxys5l9vk39ft0hswscxgseawc77y2wqlr558h";
// Lock script of the deploy account
const outputScriptLock = parseAddress(address);
// Binary data you want to deploy
const scriptBinary = Uint8Array.of(1);

let deployOptions = {
  cellProvider: indexer,
  scriptBinary: scriptBinary,
  outputScriptLock: outputScriptLock,
}

// Ganarate txSkeleton for deploying with data.
let txSkeleton = await generateDeployWithDataTx(deployOptions);
// Or if you want to delpoy with Type ID so that you can upgarde the contract in the future.
let txSkeleton = await generateDeployWithTypeIdTx(deployOptions);

// Pay transaction fee.
txSkeleton = await payFee(txSkeleton, address, txFee);
// Then you can sign and seal the transaction for sending.


// To upgrade a contract with Type ID, add its Type ID to deployOptions.
const typeId = {
  code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
  hash_type: 'type',
  args: '0x7abcd9f949a16b40ff5b50b56e62d2a6a007e544d8491bb56476693b6c45fd27'
}
const upgradeOptions = {
  cellProvider: cellProvider,
  scriptBinary: scriptBinary,
  outputScriptLock: outputScriptLock,
  typeId: typeId
}
// Ganarate txSkeleton for upgrading.
let upgradeTxSkeleton = await generateUpgradeTypeIdDataTx(upgradeOptions);
```
