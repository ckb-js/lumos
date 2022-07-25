# Migrate From BigInt to BI

Lumos was initially designed to run in NodeJS 12+, but we found that some dApps actually run in browsers, and some
earlier browsers, such as Safari on iOS13, do not support the `BigInt`, so we migrate the bigint-related APIs
from `BigInt` to `BI`, a big integer wrapper.

### Migration Rule

In order to keep compatibility, we have adapted the API according to the following rules

#### BigInt in Parameter

We provide a union API that allow user pass a `BIish` as the parameter, for example, both `toBigUint128LE(1n)`
and `toBigUint128LE(BI.from(1))` will work

#### BigInt in Return

We provide a new API for returning BI that ends with Compatible, for example,
both `readBigUint128LE -> readBigUint128LECompatible`

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
- `sudt.issueToken`
- `sudt.transfer`
