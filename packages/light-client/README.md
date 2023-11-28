# @ckb-lumos/light-client

This module provides the RPC binding for the [CKB Light Client](https://github.com/nervosnetwork/ckb-light-client).

```ts
import { LightClientRPC } from "@ckb-lumos/light-client";

const lightClientRPC = new LightClientRPC("http://localhost:9000");
lightClientRPC.getTipHeader().then(console.log);
```
