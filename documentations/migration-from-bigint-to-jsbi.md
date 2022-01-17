## Migration From BigInt to JSBI

Lumos was initially designed to run in NodeJS 12+, but we found that some of the dApps actually run in browsers, and some of the earlier browsers, such as safari in iOS13, do not support the BigInt feature, so we plan to migrate the bigint-related APIs from BigInt to JSBI. If your dApp is also having this problem, you can use the code under this branch to build the program.

In order to keep compatibility, we have adapted the API according to the following rules

### Migration Rule

#### BigInt in Parameter

We provide a union API that allow user pass a JSBI as the parameter, for example, both `toBigUint128LE(1n)` and `toBigUint128LE(JSBI.BigInt(1))` will work

#### BigInt in Return

We provide a new API for returning JSBI that ends with Compatible, for example, both `readBigUint128LE -> readBigUint128LECompatible`

## Progress

- [x] base
- [x] config-manager
- [x] helpers
- [x] rpc
- [x] ckb-indexer
- [x] common-scripts
- [x] hd
- [x] hd-cache
- [x] transaction-manager

## Quick Start

The migration is still a work in progress and you will need to work ahead based on this branch, see the following example

```
git clone https://github.com/nervosnetwork/lumos.git
cd lumos
make build-jsbi
cd packages/base
yarn link

cd /path/to/my/proj
yarn link @ckb-lumos/base
```

### package.json

```json
{
  "resolutions": {
    "@ckb-lumos": "x.y.z"
  }
}
```

### Codemod

```ts
// before
minimalCapacity(...) // bigint

// after
minimalCapacityCompatible(...) // JSBI
```

## Related API

### base

- `JSBI`
- `isJSBI`
- `parseSince` -> `parseSinceCompatible`
- `generateSince`
- `toBigUInt64LE`
- `readBigUInt64LE` -> `readBigUint64LECompatible`
- `toBigUInt128LE`
- `readBigUInt128LE` -> `readBigUInt128LECompatible`

### helpers

- `minimalCellCapacity` -> `minimalCellCapacityCompatible`
- `hashWitness`

### indexer

- `waitForSync`

### hd-cache

- `getBalance`
- private `innerLoopTransactions`
- private `loopTransactions`

### ckb-indexer

- `subscribe`
- `generateSearchKey`

### common-scripts

- `calculateMaximumWithdraw` -> `calculateMaximumWithdrawCompatible`
- `calculateDaoEarliestSince` -> `calculateDaoEarliestSinceCompatible`
- `injectCapacityWithoutChange` -> `injectCapacityWithoutChangeCompatible`
- `deploy.completeTx`
- `deploy.calculateTxFee`
- `deploy.calculateFee`
- `secp256k1_blake160.transfer` -> `secp256k1_blake160.transferCompatible`
- `secp256k1_blake160.payFee`
- `secp256k1_blake160.injectCapacity`
- `secp256k1_blake160_multisig.transfer` -> `secp256k1_blake160_multisig.transferCompatible`
- `secp256k1_blake160_multisig.payFee`
- `secp256k1_blake160_multisig.injectCapacity`
- `anyone_can_pay.checkLimit`
- `anyone_can_pay.setupOutputCell`
- `anyone_can_pay.injectCapacity`
- `anyone_can_pay.prepareSigningEntries`
- `anyone_can_pay.withdraw`
- `common.transfer`
- `common.injectCapacity`
- `common.payFee`
- `common._commonTransferCompatible`
- `common._deductCapacityCompatible`
- `common.collectInputCompatible`
- `common.payFeeByFeeRate`
- `dao.deposit`
- `dao.parseEpoch` -> `dao.parseEpochCompatible`
- `dao.epochSince`-> `dao.epochSinceCompatible`
- `dao.calculateDaoEarliestSince` -> `dao.calculateDaoEarliestSinceCompatible`
- `dao.extractDaoData` -> `dao.extractDaoDataCompatible`
- `locktime_pool.transfer` -> `locktime_pool.transferCompatible`
- `locktime_pool.injectCapacityWithoutChange` -> `locktime_pool.injectCapacityWithoutChangeCompatible`
- `locktime_pool.payFee`
- `locktime_pool.injectCapacity`
- `locktime_pool._parseMultisigArgsSince` -> `locktime_pool._parseMultisigArgsSinceCompatible`
- `sudt.issueToken`
- `sudt.transfer`
- `form_info.multisigArgs`
