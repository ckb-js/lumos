# `@ckb-lumos/helpers`

Helper utilities for working with CKB transactions from lumos.

The difference between this and `@ckb-lumos/base`, is that `@ckb-lumos/base` contains only core definitions, while this module contains utilities used in a framework sense. One example is: you can pretty much use `@ckb-lumos/base` as a standalone library, while this library integrates more with `config` module so it knows whether the framework is running under testnet, or mainnet environment.

## Usage

```javascript
const { minimalCellCapacity, generateAddress, parseAddress } = require("@ckb-lumos/helpers")

// Get cell minimal capacity.
const result = minimalCellCapacity({
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
    },
    type: null,
  },
  data: "0x",
  block_hash: null,
  block_number: null,
  out_point: null,
})

// result will be 6100000000n shannons.

// Use `generateAddress` to get address from lock script.
const address = generateAddress({
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x36c329ed630d6ce750712a477543672adab57f4c",
})

// Then you will get mainnet address "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd", or you can generate testnet address by
const { predefined } = require("@ckb-lumos/config-manager")

const address = generateAddress({
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x36c329ed630d6ce750712a477543672adab57f4c",
}, { config: predefined.AGGRON4 })

// Will get testnet address "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83".

// Use `parseAddress` to get lock script from an address.
const script = parseAddress("ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd")

// TransactionSkeleton <=> Object

// Convert TransactionSkeleton to js object
const obj = transactionSkeletonToObject(txSkeleton)
// then your can write to json file
fs.writeFileSync("your file", JSON.stringify(obj))

// Or convert js object to TransactionSkeleton
// If your object is from json file, make sure `cellProvider` is working properly.
const txSkeleton = objectToTransactionSkeleton(obj)
```
