# @ckb-lumos-experiment/molecule

[Molecule](https://github.com/nervosnetwork/molecule) is a lightweight serialization system that focuses only on the layout of byte(s) and not on specific data
types. This library will help developers to create TypeScript-friendly molecule bindings in a simple way

## Quick Start

```ts
import { layout, common } from "@ckb-lumos-experiment/molecule";

const { table } = layout;
const { Uint8, Uint128, UTF8String } = common;

// table UDTInfo {
//  total_supply: Uint128,
//  name: UTF8String,
//  symbol: UTF8String,
//  decimals: Uint8,
// }
// array Uint8 [byte; 1];
// array Uint128 [byte; 16];
// vector UTF8String <byte>;

// 1. create molecule binding
const UDTInfo /*: Codec*/ = table(
  {
    totalSupply: Uint128LE,
    name: UTF8String,
    symbol: UTF8String,
    decimals: Uint8,
  },
  ["totalSupply", "name", "symbol", "decimals"]
);

// 2. usage
const buf /*: ArrayBuffer*/ = UDTInfo.pack({
  totalSupply: BI.from(21000000 ** 10 * 8),
  name: "Fake BitCoin",
  symbol: "FBTC",
  decimals: 8,
});
```
