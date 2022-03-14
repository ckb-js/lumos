# `@ckb-lumos/experiment-tx-assembler`

This package provides functions to simplify the transaction assembling process.

## Usage

`createScriptRegistry` is for creating and managing script more easier.

```ts
import { createScriptRegistry } from "@ckb-lumos/experiment";
import { predefined } from "@ckb-lumos/config-manager";
const { AGGRON4 } = predefined;
const registry = createScriptRegistry(AGGRON4.SCRIPTS);
const secp256k1Script = registry.newScript("SECP256K1_BLAKE160", "0x");
const newRegistry = registry.extend({
  OMNI_LOCK: {
    CODE_HASH:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    HASH_TYPE: "type",
    TX_HASH:
      "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
    INDEX: "0x0",
    DEP_TYPE: "code",
  },
});
const omniCellDep = newRegistry.newCellDep("OMNI_LOCK");
```

To create input or output cells, you can use `createCell` or `createCellWithMinimalCapacity`, you can also indicate `type`, `data`, `block_hash`, `block_number` of the cell.

- Create an input cell:

  ```ts
  const lock: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0x159890a7cacb44a95bef0743064433d763de229c",
    hash_type: "type",
  };
  const outPoint = {
    tx_hash:
      "0x942c23f72f0a2558a0029522b1dea2a7c64ba5196aed829ab6bfe4b6c3270958",
    index: "0x0",
  };
  const cell = createCell({
    lock: lock,
    capacity: BI.from("10000000000"),
    out_point: outPoint,
  });
  ```

- Create an output cell:

  ```ts
  const lock: Script = {
    code_hash:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    hash_type: "type",
    args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
  };
  const cell = createCell({ lock: lock, capacity: BI.from("10000000000") });
  ```

- Create cell with minimal capacity:
  ```ts
  const lock: Script = {
    code_hash:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    hash_type: "type",
    args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
  };
  const cell = createCellWithMinimalCapacity({ lock: lock });
  ```
