import { Cell, Script } from "@ckb-lumos/base";
import { common } from "@ckb-lumos/common-scripts";
import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  generateDeployWithDataTx,
  generateDeployWithTypeIdTx,
  generateUpgradeTypeIdDataTx,
} from "../src/deploy";
import { predefined } from "@ckb-lumos/config-manager";
const { AGGRON4 } = predefined;

const outputScriptLock: Script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x159890a7cacb44a95bef0743064433d763de229c",
};
const scriptBinary = Uint8Array.of(1);

test("deploy with data", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: '0x20571233ca',
        lock: {
          args: '0x159890a7cacb44a95bef0743064433d763de229c',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: undefined
      },
      data: '0x',
      out_point: {
        index: '0x1',
        tx_hash: '0xc89e42c6b88a1c7625ccd24154358fe5e75b39091a848e59ac7f9eaeb7a70285'
      },
      block_number: '0x334d6f'
    }
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4
  };

  let txSkeleton = await generateDeployWithDataTx(deployOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x48eb99c9e521558a6f3ab28cc7d4feba28d244030731fcf016fccad286db6c57",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("deploy with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: '0x20571233ca',
        lock: {
          args: '0x159890a7cacb44a95bef0743064433d763de229c',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: undefined
      },
      data: '0x',
      out_point: {
        index: '0x1',
        tx_hash: '0xc89e42c6b88a1c7625ccd24154358fe5e75b39091a848e59ac7f9eaeb7a70285'
      },
      block_number: '0x334d6f'
    }
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4
  };

  let txSkeleton = await generateDeployWithTypeIdTx(deployOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xb0753fb435979181666a02d9b5b2754262fc0fed4b07795bcd7d6394cbe89e37",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("upgrade with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: '0x2f4fa9f00',
        lock: {
          args: '0x159890a7cacb44a95bef0743064433d763de229c',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: {
          args: '0x721830d0c6c1302d7918ed99c94a50934099589170afcd1cc80eb6ab0b7b54bd',
          code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
          hash_type: 'type'
        }
      },
      data: '0x01',
      out_point: {
        index: '0x0',
        tx_hash: '0x267aaa55e63b8380247e5f036125dbfa6c5f9cdfd78706e2eb98729306d241cb'
      },
      block_number: '0x33ca8e'
    },
    {
      cell_output: {
        capacity: '0x1718c7e00',
        lock: {
          args: '0x159890a7cacb44a95bef0743064433d763de229c',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: undefined
      },
      data: '0x01',
      out_point: {
        index: '0x0',
        tx_hash: '0xd4168b863ed95d627c393afde54a0392aa96c09fc0611bddf10489fce798825b'
      },
      block_number: '0x33c62f'
    },
    {
      cell_output: {
        capacity: '0x1edf8fd4ca',
        lock: {
          args: '0x159890a7cacb44a95bef0743064433d763de229c',
          code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hash_type: 'type'
        },
        type: undefined
      },
      data: '0x',
      out_point: {
        index: '0x1',
        tx_hash: '0xd4168b863ed95d627c393afde54a0392aa96c09fc0611bddf10489fce798825b'
      },
      block_number: '0x33c62f'
    }
  ];
  const cellProvider = new CellProvider(inputs);
  const upgradeOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    typeId: {
      code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
      hash_type: 'type' as const,
      args: '0x721830d0c6c1302d7918ed99c94a50934099589170afcd1cc80eb6ab0b7b54bd'
    },
    config: AGGRON4,
  };

  let txSkeleton = await generateUpgradeTypeIdDataTx(upgradeOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x8b0d1eaff6dc9dba83ec08b25baa6df675e548efc8978d84c199ab3f169e3b11",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});
