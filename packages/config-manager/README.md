# @ckb-lumos/config-manager

## Example

```ts
import { initializeConfig, predefined } from '@ckb-lumos/config';
import { encodeToAddress } from '@ckb-lumos/helper'

initializeConfig(predefined.AGGRON);
encodeToAddress({...}) // ckt1...


initializeConfig(predefined.LINA);
encodeToAddress({...}) // ckb1...
```

## Refreshing Config

```ts
import { refreshScriptConfig } from "@ckb-lumos/config";
import { RPC } from "@ckb-lumos/rpc";

const rpc = new RPC("http://localhost:8114");

const refreshed = await refreshScriptConfigs(predefined.AGGRON4.SCRIPTS, {
  resolve: createRpcResolver(rpc),
});
```
