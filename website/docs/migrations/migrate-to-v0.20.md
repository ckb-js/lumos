# Migration to Lumos 0.20

## Remove `computeScriptHash` Second Parameter

In an early version, we make the second parameter be ignored in it's implement.

Now we fully remove it.

```ts
import { utils } from "@ckb-lumos/lumos"
// before
const scriptHash = computeScriptHash(script, option)
// Just remove the second parameter in your code 👆
// after
const scriptHash = computeScriptHash(script)
```
