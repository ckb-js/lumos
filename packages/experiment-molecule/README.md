# @ckb-lumos/molecule

[Molecule](https://github.com/nervosnetwork/molecule) is a lightweight serialization system that focuses only on the
layout of byte(s) and not on specific data types. This library will help developers to create TypeScript-friendly
molecule bindings in an easy way.

```mermaid
graph TD;
    ArrayBuffer-->Codec;
    Codec-->JSObject;
    JSObject-->Codec;
    Codec-->ArrayBuffer
```

## Quick Start

```ts
import { struct, Uint8, Uint128 } from "@ckb-lumos/experiment-molecule";

// table UDTInfo {
//  total_supply: Uint128,
//  decimals: Uint8,
// }
// array Uint8 [byte; 1];
// array Uint128 [byte; 16];

// 1. create molecule binding
const UDTInfo /*: Codec */ = struct(
  {
    totalSupply: Uint128,
    decimals: Uint8,
  },
  ["totalSupply", "decimals"]
);

// 2. usage
const buf /*: ArrayBuffer*/ = UDTInfo.pack({
  totalSupply: BI.from(21000000 * 10 ** 8),
  decimals: 8,
});
```

## Layout

`layout` is a set of `Codec` that helps to bind molecule to JavaScript plain object/array

- array: `Array<T>` <=> `ArrayBuffer`
- vector: `Array<T>` <=> `ArrayBuffer`
- struct: `{ [key: string]: T }` <=> `ArrayBuffer`
- table: `{ [key: string]: T }` <=> `ArrayBuffer`
- option: `T | undefined` <=> `ArrayBuffer`
- union: `{ type: string, value: T }` <=> `ArrayBuffer

## Common

`common` is a set of `Codec` that helps to bind molecule to familiar JavaScript data types.

For more details, please check the [common mocule](./src/common.ts)

```ts
Uint32.pack(100); // ArrayBuffer([100, 0, 0, 0])
```

## Custom Codec

When we encounter molecule layouts like `byte` | `array SomeBytes [byte; n]` | `vector SomeBytes <byte>`, and the common
codec is not sufficient, we can customize the codec to help us interpret these byte(s)

Let's see an example of how to implement a `UTF8String` codec. If we want to store a UTF8String of indefinite length,
then the corresponding molecule structure should be a `vector UTF8String <byte>`

```ts
import { byteVecOf } from "@ckb-lumos/experiment-molecule/lib/base";
import { Buffer } from "buffer"; // https://github.com/feross/buffer

const UTF8String = byteVecOf<string>({
  pack: (str) => {
    return Uint8Array.from(Buffer.from(str, "utf8")).buffer;
  },
  unpack: (buf) => {
    return Buffer.from(buf).toString("utf8");
  },
});
```

## Why I Need This Module

molecule is flexible in that it is a serialization scheme that focuses only on byte(s) layout. When developers
encounter `byte` | `array FixedBytes [byte; n]` | `vector DynBytes <byte>`, these byte(s) need to be translated into
understandable data types, such as `array Uint32 [byte; 4]` is generally translated as `number`.

This module can help us convert bytes to common data types in a simple way. If you have some experience with CKB, you
will have encountered more complex scripts
like [OmniLock](https://github.com/XuJiandong/docs-bank/blob/master/omni_lock.md), where it is easy to get confused
about how to handle bytes when we want to sign it, if we can combine `WitnessArgs.lock(BytesOpt)`
with `OmniLockWitnessLock.signature(BytesOpt)`, then it will be easier to do the signing, we can check
[the real world OmniLock witness case](./tests/common.test.ts) to see how it works

```mol
table WitnessArgs {
    lock:                   BytesOpt,          // Lock args
    input_type:             BytesOpt,          // Type args for input
    output_type:            BytesOpt,          // Type args for output
}

table OmniLockWitnessLock {
    signature: BytesOpt,
    rc_identity: RcIdentityOpt,
    preimage: BytesOpt,
}
```

![](./assets/suggest-trigger.gif)
