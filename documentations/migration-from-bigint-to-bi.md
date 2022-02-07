## Migration From BigInt to BI

Lumos was initially designed to run in NodeJS 12+, but we found that some of the dApps actually run in browsers, and some of the earlier browsers, such as safari in iOS13, do not support the BigInt feature, so we plan to migrate the bigint-related APIs from BigInt to BI. If your dApp is also having this problem, you can use the code under this branch to build the program.

In order to keep compatibility, we have adapted the API according to the following rules

### Migration Rule

#### BigInt in Parameter

We provide a union API that allow user pass a BIish as the parameter, for example, both `toBigUint128LE(1n)` and `toBigUint128LE(BI.from(1))` will work

#### BigInt in Return

We provide a new API for returning BI that ends with Compatible, for example, both `readBigUint128LE -> readBigUint128LECompatible`

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
make build-bi
cd packages/bi
yarn link

cd /path/to/my/proj
yarn link @ckb-lumos/bi
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
minimalCapacityCompatible(...) // BI
```

## Related API

### base

- `parseSince` -> `parseSinceCompatible`
- `generateSince`
- `toBigUInt64LE`
- `readBigUInt64LE` -> `readBigUint64LECompatible`
- `toBigUInt128LE`
- `readBigUInt128LE` -> `readBigUInt128LECompatible`

### helpers

- `minimalCellCapacity` -> `minimalCellCapacityCompatible`

### common-scripts

- `anyone_can_pay.checkLimit`
- `anyone_can_pay.injectCapacity`
- `anyone_can_pay.withdraw`
- `common.transfer`
- `common.injectCapacity`
- `common.payFee`
- `common.payFeeByFeeRate`
- `common.collectInputCompatible`
- `dao.deposit`
- `dao.calculateDaoEarliestSince` -> `dao.calculateDaoEarliestSinceCompatible`
- `dao.extractDaoData` -> `dao.extractDaoDataCompatible`
- `dao.calculateMaximumWithdraw` -> `dao.calculateMaximumWithdrawCompatible`
- `deploy.completeTx`
- `deploy.injectCapacity`
- `deploy.calculateTxFee`
- `deploy.calculateFee`
- `locktime_pool.transfer` -> `locktime_pool.transferCompatible`
- `locktime_pool.injectCapacityWithoutChange` -> `locktime_pool.injectCapacityWithoutChangeCompatible`
- `locktime_pool.payFee`

- `secp256k1_blake160.transfer` -> `secp256k1_blake160.transferCompatible`
- `secp256k1_blake160.payFee`
- `secp256k1_blake160_multisig.transfer` -> `secp256k1_blake160_multisig.transferCompatible`
- `secp256k1_blake160_multisig.payFee`

* `sudt.issueToken`
* `sudt.transfer`
