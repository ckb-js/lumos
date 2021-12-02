## Migration From BigInt to JSBI

Lumos was initially designed to run in NodeJS 12+, but we found that some of the dApps actually run in browsers, and some of the earlier browsers, such as safari in iOS13, do not support the BigInt feature, so we plan to migrate the bigint-related APIs from BigInt to JSBI. If your dApp is also having this problem, you can use the code under this branch to build the program

## Progress

- [x] base
- [x] config-manager
- [x] helpers
- [x] rpc
- [ ] ckb-indexer
- [ ] common-scripts
- [ ] hd
- [ ] hd-cache

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

## base

- `JSBI`: `added`
- `isJSBI`: `added`
- `parseSince`: `changed(return)`
- `generateSince`: `changed(return)`
- `toBigUInt64LE`: `changed(param)`
- `readBigUInt64LE`: `changed(return)`
- `toBigUInt128LE`: `changed(param)`
- `readBigUInt128LE`: `changed(return)`

## helpers

- `minimalCellCapacity`: `changed(return)`
