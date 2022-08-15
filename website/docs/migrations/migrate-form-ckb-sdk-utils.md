# Migrate From ckb-sdk-utils to Lumos

## Summary
In order to unify CKB development ecology, the functions of `ckb-sdk-utils` will be migrated to `@ckb-lumos/lumos`, most of the functions can be replaced by the corresponding functions directly, but the `normalize.ts` need to be rewriten with `@ckb-lumos/codec`.

## @lumos/codec
@lumos/codec provides a set of functions to pack(encode) and unpack(decode) data. 
related link: https://github.com/nervosnetwork/lumos/blob/develop/packages/codec


## Migration list
- address/index.ts
	- [scriptToAddress](#scripttoaddress)
	- [bech32Address](#bech32address)
	- [pubkeyToAddress](#pubkeytoaddress)
	- [parseAddress](#parseaddress)
	- [addressToScript](#addresstoscript)
- convertors/index.ts
	- [toUint16Le](#touint16le)
	- [toUint32Le](#touint32le)
	- [toUint64Le](#touint64le)
	- [hexToBytes](#hextobytes)
	- [bytesToHex](#bytestohex)
	- [toBigEndian](#tobigendian)
- Crypto/Blake160.ts
	- [blake160](#blake160)
- Serialization/basic.ts
	- [serializeArray](#serializearray)
	- [serializeStruct](#serializestruct)
	- [serializeFixVec](#serializefixvec)
	- [serializeDynVec](#serializedynvec)
	- [serializeTable](#serializetable)
	- [serializeOption](#serializeoption)
- Serialization/script.ts
	- [serializeCodeHash](#serializecodehash)
	- [serializeHashType](#serializehashtype)
	- [serializeArgs](#serializeargs)
	- [serializeScript](#serializescript)
- Serialization/transaction.ts
	- [serializeVersion](#serializeversion)
	- [serializeOutPoint](#serializeoutpoint)
	- [serializeDepType](#serializedeptype)
	- [serializeCellDep](#serializecelldep)
	- [serializeCellDeps](#serializecelldeps)
	- [serializeHeaderDeps](#serializeheaderdeps)
	- [serializeInput](#serializeinput)
	- [serializeInputs](#serializeinputs)
	- [serializeOutput](#serializeoutput)
	- [serializeOutputs](#serializeoutputs)
	- [serializeOutputsData](#serializeoutputsdata)
	- [serializeWitnessArgs](#serializewitnessargs)
	- [serializeWitnesses](#serializewitnesses)
	- [serializeRawTransaction](#serializerawtransaction)
	- [serializeTransaction](#serializetransaction)
- epochs.ts
	- [serializeEpoch](#serializeepoch)
	- [parseEpoch](#parseepoch)
	- [getWithdrawEpoch](#getwithdrawepoch)
- occupiedCapacity.ts
	- [scriptOccupied](#scriptoccupied)
	- [cellOccupied](#celloccupied)
- sizes.ts
	- [getTransactionSize](#gettransactionsize)
- index.ts
	- [scriptToHash](#scripttohash)
	- [rawTransactionToHash](#rawtransactiontohash)
	- [privateKeyToPublicKey](#privatekeytopublickey)
	- [privateKeyToAddress](#privatekeytoaddress)
	- [extractDAOData](#extractdaodata)
	- [calculateMaximumWithdraw](#calculatemaximumwithdraw)

### scriptToAddress
``` typescript
import { scriptToAddress } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

const script = {
	codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
	hashType: "type",
	args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
}

// before
scriptToAddress(script); // ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4


// after
helpers.encodeToAddress(script);  // ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4
```

### bech32Address
``` typescript
import { bech32Address } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

// before
bech32Address("0x36c329ed630d6ce750712a477543672adab57f4c") // ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd

// after
helpers.generateSecp256k1Blake160Address("0x36c329ed630d6ce750712a477543672adab57f4c") // ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd
```

### pubkeyToAddress
``` typescript
// migrate pubkeyToAddress example

import { pubkeyToAddress } from "@nervosnetwork/ckb-sdk-utils";
import { helpers, hd, config } from "@ckb-lumos/lumos";
const pubKey = '0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01';

// normal case
// before
pubkeyToAddress(pubKey); // ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd

// after
helpers.generateSecp256k1Blake160Address(hd.key.publicKeyToBlake160(pubKey)); // ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd

// testnet
// before
pubkeyToAddress(pubKey, { prefix: AddressPrefix.Testnet }); // ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83

// after
helpers.generateSecp256k1Blake160Address(hd.key.publicKeyToBlake160(pubKey), { config: config.predefined.AGGRON4 }); // ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83
```

### parseAddress
``` typescript
import { parseAddress } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

// before
parseAddress("ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83", "hex") // 0x010036c329ed630d6ce750712a477543672adab57f4c

// after
'0x0100' + helpers.addressToScript('ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83', { config: config, predefined.AGGRON4 }).args.substring(2) // 0x010036c329ed630d6ce750712a477543672adab57f4c
```

### addressToScript
``` typescript
import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

const address = "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd";

// before
addressToScript(address);
// {
// 	codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
// 	hashType: 'type',
// 	args: '0x36c329ed630d6ce750712a477543672adab57f4c'
// }

// after
helpers.addressToScript(address);
// {
//   codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
//   hashType: 'type',
//   args: '0x36c329ed630d6ce750712a477543672adab57f4c'
// }
```

### toUint16Le
``` typescript
import { toUint16Le } from "@nervosnetwork/ckb-sdk-utils";
import { number, bytes } from "@ckb-lumos/codec";

const value = "0xabcd"

// before
toUint16Le(value)

// after
bytes.hexify(number.Uint16LE.pack(value))
```

### toUint32Le
``` typescript
import { toUint32Le } from "@nervosnetwork/ckb-sdk-utils";
import { number, bytes } from "@ckb-lumos/codec";

const value = "0x12345678"

// before
toUint32Le(value)

// after
bytes.hexify(number.Uint32LE.pack(value))
```

### toUint64Le
``` typescript
  import { toUint64Le } from "@nervosnetwork/ckb-sdk-utils";
  import { number, bytes } from "@ckb-lumos/codec";

	const value = "0x1234567890abcdef"

  // before
	toUint64Le(value)

  // after
	bytes.hexify(number.Uint64LE.pack(value))
```

### hexToBytes
``` typescript
import { hexToBytes } from "@nervosnetwork/ckb-sdk-utils";
import { bytes } from "@ckb-lumos/codec";

const hexfixture = "0xabcd";
// before
hexToBytes(hexfixture)

// after
bytes.bytify(hexfix)
```

### bytesToHex
``` typescript
import { bytesToHex } from "@nervosnetwork/ckb-sdk-utils";
import { bytes } from "@ckb-lumos/codec";

const bytesfixture = "0xabcd";
// before
bytesToHex(bytesfixture)

// after
bytes.hexify(bytesfixture)
```

### toBigEndian
``` typescript
import { toBigEndian } from "@nervosnetwork/ckb-sdk-utils";
import { number } from "@ckb-lumos/codec";

const fixture = '0x3ef9e8c069c925ef'
// before
toBigEndian(fixture) // 0xef25c969c0e8f93e
// after
bytes.hexify(bytes.bytify(fixture).reverse()) // 0xef25c969c0e8f93e
```

### blake160
``` typescript
import { toBigEndian } from "@nervosnetwork/ckb-sdk-utils";
import { utils } from "@ckb-lumos/lumos";

const pk = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

// before
blake160(pk, 'hex') // 7d0252b620af274af951e534e182c7a57df86da7

// after
new utils.CKBHasher()
  .update(pk)
  .digestHex()
  .slice(0, 42)
  .substring(2) // 7d0252b620af274af951e534e182c7a57df86da7
```

### serializeArray
``` typescript
import { serializeArray } from "@nervosnetwork/ckb-sdk-utils";
import { bytes } from "@ckb-lumos/codec";

const fixtureArray = [104, 213, 67, 138]

// before
serializeArray(fixtureArray)

// after
bytes.hexify(fixtureArray)
```

### serializeStruct
``` typescript
import { serializeStruct } from "@nervosnetwork/ckb-sdk-utils";
import { number, bytes, molecule } from "@ckb-lumos/codec";

// before
serializeStruct(new Map<string, any>([
  ['f1', "0xab"], 
  ['f2', "0x04030201"],
]))

// after
const structCodec = molecule.struct(
  { 
    f1: number.Uint8,
    f2: number.Uint32BE,
  },
  ["f1", "f2"]
)

bytes.hexify(structCodec.pack({
  f1: 0xab,
  f2: 0x04030201,
}))
```



### serializeFixVec
``` typescript
import { serializeStruct } from "@nervosnetwork/ckb-sdk-utils";
import { fixvec } from "@ckb-lumos/codec/lib/molecule/layout";
import { number, bytes } from "@ckb-lumos/codec";

// before
serializeFixVec(["0x12"])) // 0x0100000012

// after
const fixvecCodec = fixvec(number.Uint8)
bytes.hexify(fixvecCodec.pack([0x12])) // 0x0100000012
```


### serializeDynVec
``` typescript
import { serializeDynVec } from "@nervosnetwork/ckb-sdk-utils";
import { dynvec } from "@ckb-lumos/codec/lib/molecule/layout";
import { bytes, createBytesCodec } from "@ckb-lumos/codec";

// before
serializeDynVec([]) // 0x04000000
serializeDynVec(["0x02001234"]) // 0x0c0000000800000002001234
serializeDynVec(["0x02001234", "0x00000000", "0x02000567", "0x01000089", "0x0300abcdef"]) // 0x2d000000180000001c000000200000002400000028000000020012340000000002000567010000890300abcdef

// after
const bytesCodec = createBytesCodec<string>({
  pack: (hex) => bytes.bytify(hex),
  unpack: (buf) => bytes.hexify(buf),
})
const dynvecCodec = dynvec(bytesCodec)
bytes.hexify(dynvecCodec.pack([])) // 0x00000000
bytes.hexify(dynvecCodec.pack(["0x02001234"])) // 0x0c0000000800000002001234
bytes.hexify(dynvecCodec.pack(["0x02001234", "0x00000000", "0x02000567", "0x01000089", "0x0300abcdef"])) // 0x2d000000180000001c000000200000002400000028000000020012340000000002000567010000890300abcdef
```

### serializeTable
``` typescript
import { serializeTable } from "@nervosnetwork/ckb-sdk-utils";
import { table } from "@ckb-lumos/codec/lib/molecule/layout";
import { bytes, number, createBytesCodec } from "@ckb-lumos/codec";

// before
serializeTable(new Map([["f1", "0xab"], ["f2", "0x04030201"]])) // 0x110000000c0000000d000000ab04030201

// after
const bytesCodec = createBytesCodec<string>({
  pack: (hex) => bytes.bytify(hex),
  unpack: (buf) => bytes.hexify(buf),
})

const tableCodec = table(
  { f1: bytesCodec, f2: bytesCodec },
  ["f1", "f2"],
)
bytes.hexify(tableCodec.pack({ f1: "0xab", f2: "0x04030201" })) // 0x110000000c0000000d000000ab04030201
```

### serializeOption
``` typescript
import { serializeOption } from "@nervosnetwork/ckb-sdk-utils";
import { option } from "@ckb-lumos/codec/lib/molecule/layout";
import { bytes, createBytesCodec } from "@ckb-lumos/codec";

// before
serializeOption() // 0x
serializeOption("0x") // 0x
serializeOption("0x0c0000000800000000000000") // 0x0c0000000800000000000000


// after
const bytesCodec = createBytesCodec<string>({
  pack: (hex) => bytes.bytify(hex),
  unpack: (buf) => bytes.hexify(buf),
})
const optionCodec = option(bytesCodec);

bytes.hexify(optionCodec.pack()) // 0x
bytes.hexify(optionCodec.pack("0x")) // 0x
bytes.hexify(optionCodec.pack("0x0c0000000800000000000000")) // 0x0c0000000800000000000000
```

### serializeCodeHash
``` typescript
import { serializeCodeHash } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

const hash = '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88'
// before
serializeCodeHash(hash) // 0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88

// after
bytes.hexify(blockchain.Byte32.pack(hash)) // 0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88
```

### serializeHashType
``` typescript
import { serializeHashType } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeHashType('data') // 0x00
serializeHashType('type') // 0x01

// after
bytes.hexify(blockchain.HashType.pack('data')) // 0x00
bytes.hexify(blockchain.HashType.pack('type')) // 0x01
```

### serializeArgs
``` typescript
import { serializeArgs } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

const args = '0x8536c9d5d908bd89fc70099e4284870708b6632356aad98734fcf43f6f71c304'
// before
serializeArgs(args) // 0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88

// after
bytes.hexify(blockchain.Bytes.pack(args)) // 0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88
```

### serializeScript
``` typescript
import { serializeScript } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeScript({ 
  "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
  "args": "0x3954acece65096bfa81258983ddb83915fc56bd8",
  "hashType": "type"
}) // 0x4900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e8801140000003954acece65096bfa81258983ddb83915fc56bd8

// after
bytes.hexify(blockchain.Script.pack({
  "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
  "args": "0x3954acece65096bfa81258983ddb83915fc56bd8",
  "hashType": "type"
})) // 0x4900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e8801140000003954acece65096bfa81258983ddb83915fc56bd8
```

### serializeVersion
``` typescript
import { serializeVersion } from '@nervosnetwork/ckb-sdk-utils';
import { bytes, number } from '@ckb-lumos/codec';

// before
serializeVersion('0x0') // 0x00000000
serializeVersion('0x1') // 0x01000000
serializeVersion('0xabcd') // 0xcdab0000

// after
bytes.hexify(number.Uint32LE.pack('0x0')) // 0x00000000
bytes.hexify(number.Uint32LE.pack('0x1')) // 0x01000000
bytes.hexify(number.Uint32LE.pack('0xabcd')) // 0xcdab0000
```

### serializeOutPoint
``` typescript
import { serializeOutPoint } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeOutPoint({
  "txHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "index": "0xffffffff"
}) // 0x0000000000000000000000000000000000000000000000000000000000000000ffffffff

// after
bytes.hexify(blockchain.OutPoint.pack({
  "txHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "index": 0xffffffff,
})) // 0x0000000000000000000000000000000000000000000000000000000000000000ffffffff
```

### serializeDepType
``` typescript
import { serializeDepType } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeDepType('code') // 0x00
serializeDepType('depGroup') // 0x01

// after
bytes.hexify(blockchain.DepType.pack('code')) // 0x00
bytes.hexify(blockchain.DepType.pack('depGroup')) // 0x01
```

### serializeCellDep
``` typescript
import { serializeCellDep } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeCellDep({
  "outPoint": {
    "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
    "index": "0x0"
  },
  "depType": "depGroup"
}) // 0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b0000000001

// after
bytes.hexify(blockchain.CellDep.pack({
  "outPoint": {
    "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
    "index": 0x0,
  },
  "depType": "depGroup"
})) // 0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b0000000001

```

### serializeCellDeps
``` typescript
import { serializeCellDeps } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeCellDeps([
  {
    "outPoint": {
      "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
      "index": "0x0"
    },
    "depType": "depGroup"
  },
  {
    "outPoint": {
      "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
      "index": "0x2"
    },
    "depType": "code"
  }
]) // 0x02000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f600200000000

// after
bytes.hexify(blockchain.CellDepVec.pack([
  {
    "outPoint": {
      "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
      "index": 0x0
    },
    "depType": "depGroup"
  },
  {
    "outPoint": {
      "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
      "index": 0x2
    },
    "depType": "code"
  }
])) // 0x02000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f600200000000
```

### serializeHeaderDeps
``` typescript
import { serializeHeaderDeps } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeHeaderDeps([]) // 0x00000000
serializeHeaderDeps([
  "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
  "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60"
]) // 0x02000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60

// after
bytes.hexify(blockchain.Byte32Vec.pack([])) //0x00000000
bytes.hexify(blockchain.Byte32Vec.pack([
  "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
  "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60"
])) // 0x02000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60
```

### serializeInput
``` typescript
import { serializeInput } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI } from '@ckb-lumos/lumos';

// before
serializeInput({
  "previousOutput": {
    "txHash": "0xca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f",
    "index": "0x0"
  },
  "since": "0x2003e8018c000168"
}) // 0x6801008c01e80320ca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f00000000

// after
bytes.hexify(blockchain.CellInput.pack({
  "previousOutput": {
    "txHash": "0xca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f",
    "index": 0x0
  },
  "since": BI.from(0x2003e8018c000168)
})) // 0x0002008c01e80320ca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f00000000
```

### serializeInputs
``` typescript
import { serializeInputs } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI } from '@ckb-lumos/lumos';

// before
serializeInputs([
  {
    "previousOutput": {
      "txHash": "0xca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f",
      "index": "0x0"
    },
    "since": "0x2003e8018c000168"
  }
]) // 0x010000006801008c01e80320ca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f00000000

// after
bytes.hexify(blockchain.CellInputVec.pack([
  {
    "previousOutput": {
      "txHash": "0xca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f",
      "index": 0x0
    },
    "since": BI.from(0x2003e8018c000168)
  }
])) // 0x010000006801008c01e80320ca4b23ebeafde1b92fb0b848fc26e140c8e457b1ce2f7816da5b7bf9a07aa15f00000000
```

### serializeOutput
``` typescript
import { serializeOutPoint } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI } from '@ckb-lumos/lumos';

// before
serializeOutput({
  "capacity": "0x174876e800",
  "lock": {
    "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
    "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
    "hashType": "type"
  },
  "type": {
    "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
    "args": "0x",
    "hashType": "data"
  }
}) // 0x9600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f60000000000

// after
bytes.hexify(blockchain.CellOutput.pack({
  "capacity": BI.from("0x174876e800"),
  "lock": {
    "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
    "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
    "hashType": "type"
  },
  "type": {
    "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
    "args": "0x",
    "hashType": "data"
  }
}))
```

### serializeOutputs
``` typescript
import { serializeOutputs } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI } from '@ckb-lumos/lumos';

// before
serializeOutputs([
  {
    "capacity": "0x174876e800",
    "lock": {
      "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
      "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
      "hashType": "type"
    },
    "type": {
      "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
      "args": "0x",
      "hashType": "data"
    }
  },
  {
    "capacity": "0x59e1416a5000",
    "lock": {
      "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
      "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
      "hashType": "type"
    },
    "type": null
  }
]) // 0x030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061


// after
bytes.hexify(blockchain.CellOutputVec.pack([
  {
    "capacity": BI.from(0x174876e800),
    "lock": {
      "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
      "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
      "hashType": "type"
    },
    "type": {
      "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
      "args": "0x",
      "hashType": "data"
    }
  },
  {
    "capacity": BI.from(0x59e1416a5000),
    "lock": {
      "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
      "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
      "hashType": "type"
    },
  }
])) // 0x030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061
```

### serializeOutputsData
``` typescript
import { serializeOutputsData } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeOutputsData(["0x", "0x"]) // 0x140000000c000000100000000000000000000000

// after
bytes.hexify(blockchain.BytesVec.pack(["0x", "0x"])) // 0x140000000c000000100000000000000000000000
```

### serializeWitnessArgs
``` typescript
import { serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeWitnessArgs({
  lock: '0x' + '00'.repeat(65),
  inputType: '0x',
  outputType: '0x',
}) // 0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

// after
bytes.hexify(blockchain.WitnessArgs.pack({
  lock: new Uint8Array(65),
})) // 0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

### serializeWitnesses
``` typescript
import { serializeWitnesses } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec'

// before
serializeWitnesses([]) // 0x04000000
serializeWitnesses(["0x10", "0x01"]) //0x160000000c0000001100000001000000100100000001
serializeWitnesses(["0x3954acece65096bfa81258983ddb83915fc56bd8"]) // 0x2000000008000000140000003954acece65096bfa81258983ddb83915fc56bd8

// after
bytes.hexify(blockchain.BytesVec.pack([])) //0x04000000
bytes.hexify(blockchain.BytesVec.pack(["0x10", "0x01"])) // 0000001100000001000000100100000001
bytes.hexify(blockchain.BytesVec.pack(["0x3954acece65096bfa81258983ddb83915fc56bd8"])) // 0x2000000008000000140000003954acece65096bfa81258983ddb83915fc56bd8

```

### serializeRawTransaction
``` typescript
import { serializeRawTransaction } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI } from '@ckb-lumos/lumos';

// before
serializeRawTransaction({
  "version": "0x0",
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": "0x0"
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": "0x2"
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": "0x1"
      },
      "since": "0x0"
    }
  ],
  "outputs": [
    {
      "capacity": "0x174876e800",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": "0x59e1416a5000",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": null
    }
  ],
  "outputsData": ["0x", "0x"],
}) // 0xb90100001c000000200000006e00000072000000a2000000a50100000000000002000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f6002000000000000000001000000000000000000000031f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc6501000000030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061140000000c000000100000000000000000000000

// after
bytes.hexify(blockchain.RawTransaction.pack({
  "version": 0x0,
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": 0x0
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": 0x2
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": 0x1
      },
      "since": BI.from(0x0)
    }
  ],
  "outputs": [
    {
      "capacity": BI.from("0x174876e800"),
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": BI.from("0x59e1416a5000"),
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      }
    }
  ],
  "outputsData": ["0x", "0x"],
})) // 0xb90100001c000000200000006e00000072000000a2000000a50100000000000002000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f6002000000000000000001000000000000000000000031f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc6501000000030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061140000000c000000100000000000000000000000
```

### serializeTransaction
``` typescript
import { serializeTransaction } from '@nervosnetwork/ckb-sdk-utils';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';

// before
serializeTransaction({
  "version": "0x0",
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": "0x0"
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": "0x2"
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": "0x1"
      },
      "since": "0x0"
    }
  ],
  "outputs": [
    {
      "capacity": "0x174876e800",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": "0x59e1416a5000",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": null
    }
  ],
  "outputsData": ["0x", "0x"],
  "witnesses": [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900"
  ]
}) // 0x120200000c000000c5010000b90100001c000000200000006e00000072000000a2000000a50100000000000002000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f6002000000000000000001000000000000000000000031f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc6501000000030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061140000000c0000001000000000000000000000004d000000080000004100000082df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900


// after
bytes.hexify(blockchain.Transaction.pack({
  "version": "0x0",
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": "0x0"
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": "0x2"
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": "0x1"
      },
      "since": "0x0"
    }
  ],
  "outputs": [
    {
      "capacity": "0x174876e800",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": "0x59e1416a5000",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
    }
  ],
  "outputsData": ["0x", "0x"],
  "witnesses": [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900"
  ]
})) // 0x120200000c000000c5010000b90100001c000000200000006e00000072000000a2000000a50100000000000002000000c12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b00000000010fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f6002000000000000000001000000000000000000000031f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc6501000000030100000c000000a20000009600000010000000180000006100000000e87648170000004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed02061006135000000100000003000000031000000ece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f600000000006100000010000000180000006100000000506a41e15900004900000010000000300000003100000068d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88011400000059a27ef3ba84f061517d13f42cf44ed020610061140000000c0000001000000000000000000000004d000000080000004100000082df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900
```

### serializeEpoch
``` typescript
import { serializeEpoch } from "@nervosnetwork/ckb-sdk-utils";
import { since } from "@ckb-lumos/lumos";

// before
serializeEpoch({ length: "0x3e8", index: "0x10", number: "0x200" }) // 0x2003e80010000200

// after
since.generateAbsoluteEpochSince({ length: 0x3e8, index: 0x10, number: 0x200 }) // 0x2003e80010000200
```

### parseEpoch
``` typescript
import { parseEpoch } from "@nervosnetwork/ckb-sdk-utils";
import { since } from "@ckb-lumos/lumos";

// before
parseEpoch("0x1e00017000090") // { length: '0x1e0', index: '0x17', number: '0x90' }

// after
since.parseEpoch("0x1e00017000090") // { length: 480, index: 23, number: 144 }
```

### getWithdrawEpoch
``` typescript
import { getWithdrawEpoch } from "@nervosnetwork/ckb-sdk-utils";
import { commons } from "@ckb-lumos/lumos";

// before
getWithdrawEpoch('0x2000640000000000', '0x20006400630000b3') // 0x20006400000000b4

// after
'0x' + commons.dao.calculateDaoEarliestSince('0x2000640000000000', '0x20006400630000b3').toString(16) // 0x20006400000000b4
```

### scriptOccupied
``` typescript
import { scriptOccupied } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

scriptOccupied({
  args: '0x',
  codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
  hashType: 'type'
}) // 33

helpers.minimalScriptCapacityCompatible({
  args: '0x',
  codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
  hashType: 'type'
}).toNumber() / 100000000 // 33
```

### cellOccupied
``` typescript
import { cellOccupied } from "@nervosnetwork/ckb-sdk-utils";
import { helpers } from "@ckb-lumos/lumos";

cellOccupied({
  capacity: '0xe8d4a51000',
  lock: {
    args: '0x',
    codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
    hashType: 'type'
  },
}) // 41

helpers.minimalCellCapacityCompatible({
  cellOutput: {
    capacity: '0xe8d4a51000',
    lock: {
      args: '0x',
      codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
      hashType: 'type'
    },
  },
  data: '0x',
}).toNumber() / 100000000; // 41
```

### getTransactionSize
``` typescript
import { getTransactionSize } from "@nervosnetwork/ckb-sdk-utils";
import { commons } from "@ckb-lumos/lumos";

getTransactionSize({
  "version": "0x0",
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": "0x0"
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": "0x2"
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": "0x1"
      },
      "since": "0x0"
    }
  ],
  "outputs": [
    {
      "capacity": "0x174876e800",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": "0x59e1416a5000",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": null
    }
  ],
  "outputsData": ["0x1234", "0x"],
  "witnesses": [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900"
  ]
}) // 536

commons.common.__tests__.getTransactionSizeByTx({
  "version": "0x0",
  "cellDeps": [
    {
      "outPoint": {
        "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        "index": "0x0"
      },
      "depType": "depGroup"
    },
    {
      "outPoint": {
        "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        "index": "0x2"
      },
      "depType": "code"
    }
  ],
  "headerDeps": [],
  "inputs": [
    {
      "previousOutput": {
        "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        "index": "0x1"
      },
      "since": "0x0"
    }
  ],
  "outputs": [
    {
      "capacity": "0x174876e800",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": {
        "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        "args": "0x",
        "hashType": "data"
      }
    },
    {
      "capacity": "0x59e1416a5000",
      "lock": {
        "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        "hashType": "type"
      },
      "type": null
    }
  ],
  "outputsData": ["0x1234", "0x"],
  "witnesses": [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900"
  ]
}) // 536
```

### scriptToHash
``` typescript
import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils";
import { utils } from "@ckb-lumos/lumos";

// before
scriptToHash({
  codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  args: '0x',
  hashType: 'data',
}) // 0x77c93b0632b5b6c3ef922c5b7cea208fb0a7c427a13d50e13d3fefad17e0c590

// after
utils.computeScriptHash({
  codeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  args: '0x',
  hashType: 'data',
}) // 0x77c93b0632b5b6c3ef922c5b7cea208fb0a7c427a13d50e13d3fefad17e0c590
```

### rawTransactionToHash
``` typescript
import { rawTransactionToHash } from "@nervosnetwork/ckb-sdk-utils";
import { utils } from "@ckb-lumos/lumos";
import { blockchain } from '@ckb-lumos/base';

// before
rawTransactionToHash({
  version: "0x0",
  cellDeps: [
    {
      outPoint: {
        txHash: "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        index: "0x0",
      },
      depType: "depGroup",
    },
    {
      outPoint: {
        txHash: "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        index: "0x2",
      },
      depType: "code",
    },
  ],
  headerDeps: [],
  inputs: [
    {
      previousOutput: {
        txHash: "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        index: "0x1",
      },
      since: "0x0",
    },
  ],
  outputs: [
    {
      capacity: "0x174876e800",
      lock: {
        codeHash: "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: {
        codeHash: "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        args: "0x",
        hashType: "data",
      },
    },
    {
      capacity: "0x59e1416a5000",
      lock: {
        codeHash: "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: null,
    },
  ],
  outputsData: ["0x", "0x"],
}); // 0xe765f9912b06c72552dae11779f6371309236e968aa045ae3b8f426d8ec8ca05

// after
utils.ckbHash(blockchain.RawTransaction.pack({
  version: "0x0",
  cellDeps: [
    {
      outPoint: {
        txHash: "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        index: "0x0",
      },
      depType: "depGroup",
    },
    {
      outPoint: {
        txHash: "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        index: "0x2",
      },
      depType: "code",
    },
  ],
  headerDeps: [],
  inputs: [
    {
      previousOutput: {
        txHash: "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        index: "0x1",
      },
      since: "0x0",
    },
  ],
  outputs: [
    {
      capacity: "0x174876e800",
      lock: {
        codeHash: "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: {
        codeHash: "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        args: "0x",
        hashType: "data",
      },
    },
    {
      capacity: "0x59e1416a5000",
      lock: {
        codeHash: "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: null,
    },
  ],
  outputsData: ["0x", "0x"],
})); // 0xe765f9912b06c72552dae11779f6371309236e968aa045ae3b8f426d8ec8ca05
```

### privateKeyToPublicKey
``` typescript
import { privateKeyToPublicKey } from "@nervosnetwork/ckb-sdk-utils";
import { hd } from "@ckb-lumos/lumos";

const pk = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

// before
privateKeyToPublicKey(pk) // 0x03a706ad8f73115f90500266f273f7571df9429a4cfb4bbfbcd825227202dabad1

// after
hd.key.privateToPublic(pk) // 0x03a706ad8f73115f90500266f273f7571df9429a4cfb4bbfbcd825227202dabad1
```

### privateKeyToAddress
``` typescript
import { privateKeyToAddress } from "@nervosnetwork/ckb-sdk-utils";
import { hd, helpers } from "@ckb-lumos/lumos";

const pk = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

// before
privateKeyToAddress(pk, {}) // ckb1qyqw975zuu9svtyxgjuq44lv7mspte0n2tmqqm3w53

// after
const args = hd.key.privateKeyToBlake160(pk);
helpers.generateSecp256k1Blake160Address(args) // ckb1qyqw975zuu9svtyxgjuq44lv7mspte0n2tmqqm3w53
```

### extractDAOData
``` typescript
import { extractDAOData } from "@nervosnetwork/ckb-sdk-utils";
import { extractDaoDataCompatible } from "@ckb-lumos/common-scripts/lib/dao";

// before
extractDAOData('0x1aaf2ca6847c223c3ef9e8c069c9250020212a6311e2d30200609349396eb407');
// {
// 	c: '0x3c227c84a62caf1a',
// 	ar: '0x0025c969c0e8f93e',
// 	s: '0x02d3e211632a2120',
// 	u: '0x07b46e3949936000'
// }

// after
Object.entries(
  extractDaoDataCompatible('0x1aaf2ca6847c223c3ef9e8c069c9250020212a6311e2d30200609349396eb407')
).reduce((pre, current) => ({ ...pre, [current[0]]: current[1].toHexString() }), {});
// {
// 	c: '0x3c227c84a62caf1a',
// 	ar: '0x0025c969c0e8f93e',
// 	s: '0x02d3e211632a2120',
// 	u: '0x07b46e3949936000'
// }
```

### calculateMaximumWithdraw
``` typescript
import { calculateMaximumWithdraw } from "@nervosnetwork/ckb-sdk-utils";
import { commons } from "@ckb-lumos/lumos";

// before
calculateMaximumWithdraw(
  {
    "capacity":"0xe8d4a51000",
    "lock":{
        "args":"0xf601cac75568afec3b9c9af1e1ff730062007685",
        "codeHash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hashType":"type"
    },
    "type":{
        "args":"0x",
        "codeHash":"0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        "hashType":"type"
    }
  },
  '0x0000000000000000',
  '0x1aaf2ca6847c223c3ef9e8c069c9250020212a6311e2d30200609349396eb407',
  '0x9bafffa73e432e3c94c6f9db34cb25009f9e4efe4b5fd60200ea63c6d4ffb407'
) // 0xe8df95141e

// after
'0x' + commons.dao.calculateMaximumWithdraw(
  {
    cellOutput: {
      "capacity":"0xe8d4a51000",
      "lock":{
          "args":"0xf601cac75568afec3b9c9af1e1ff730062007685",
          "codeHash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          "hashType":"type"
      },
      "type":{
          "args":"0x",
          "codeHash":"0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
          "hashType":"type"
      }
    },
    data: '0x0000000000000000',
  },
  '0x1aaf2ca6847c223c3ef9e8c069c9250020212a6311e2d30200609349396eb407',
  '0x9bafffa73e432e3c94c6f9db34cb25009f9e4efe4b5fd60200ea63c6d4ffb407',
).toString(16) // 0xe8df95141e
```