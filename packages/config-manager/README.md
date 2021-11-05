# @ckb-lumos/config-manager

## Example

```ts
import { initializeConfig, predefined } from '@ckb-lumos/config';
import { generateAddress } from '@ckb-lumos/helper'

initializeConfig(predefined.AGGRON);
generateAddress({...}) // ckt1...


initializeConfig(predefined.LINA);
generateAddress({...}) // ckb1...
```
