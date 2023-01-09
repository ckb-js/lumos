# Migration to Lumos 0.20

## Browser shiming

If you are using Lumos in the browser, please add configuration according to
this [doc](../recipes/cra-vite-webpack-or-other)

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
