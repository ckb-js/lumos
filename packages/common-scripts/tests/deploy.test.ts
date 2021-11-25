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
        capacity: "0x1718c7e00",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0xa11728dd5b27224179c19e831f8e8dc0c67835bcd2d5d3bb87c7cc27d0b66cfc",
      },
      block_number: "0x352583",
    },
    {
      cell_output: {
        capacity: "0x2f4fa9f00",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0xe9451f3528af55247ff7d3851a00b54a5fe7de38d40dc29580ce2c069332633a",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x46176211dd8ea0bfaa652a08de97992fec25d243411fec63826c7ee989491d97",
      },
      block_number: "0x3525b6",
    },
    {
      cell_output: {
        capacity: "0x981bb6e5000",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x",
      out_point: {
        index: "0x1",
        tx_hash:
          "0x4c9457e28e7dd2c87be8b814e33b94d114b83d10bb3cad37de6c60f408f2773e",
      },
      block_number: "0x36145f",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4,
  };

  let { txSkeleton } = await generateDeployWithDataTx(deployOptions);
  for (const input of txSkeleton.get("inputs")) {
    const type = input.cell_output.type;
    const data = input.data;
    t.is(type, undefined);
    t.is(data, "0x");
  }
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x94d9f0ece8261dae3cd1b3efcca08ea0b7fd9c5824a96d7680557b0f92204f52",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("deploy with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x1718c7e00",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0xa11728dd5b27224179c19e831f8e8dc0c67835bcd2d5d3bb87c7cc27d0b66cfc",
      },
      block_number: "0x352583",
    },
    {
      cell_output: {
        capacity: "0x2f4fa9f00",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0xe9451f3528af55247ff7d3851a00b54a5fe7de38d40dc29580ce2c069332633a",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x46176211dd8ea0bfaa652a08de97992fec25d243411fec63826c7ee989491d97",
      },
      block_number: "0x3525b6",
    },
    {
      cell_output: {
        capacity: "0x543fd2fccaf2",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x",
      out_point: {
        index: "0x1",
        tx_hash:
          "0x0a97968e137594e7b698668202d1f63bd2dc9f070db6524125a0a74224d13b6e",
      },
      block_number: "0x36146d",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4,
  };

  let { txSkeleton } = await generateDeployWithTypeIdTx(deployOptions);
  for (const input of txSkeleton.get("inputs")) {
    const type = input.cell_output.type;
    const data = input.data;
    t.is(type, undefined);
    t.is(data, "0x");
  }
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x0b8bcfaa5d351f9c279f49247c7b306bedac63284542658002d7fdac56caf884",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("upgrade with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x2f4fa9f00",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0x2c82a38950de3204a4ae166c50331d1b104e97a21402cb5bdb7ca23bb9c15f0f",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x7afcb80f91d0a52bc376e5113494546e825a3de2b7378b3bed91fed35e2839e8",
      },
      block_number: "0x3614af",
    },
    {
      cell_output: {
        capacity: "0x1718adf5a",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x",
      out_point: {
        index: "0x1",
        tx_hash:
          "0xc68f8f08958c60ad83a81e7e590c3aba6abdaed2bbcfd8fbe0e014b7396affb1",
      },
      block_number: "0x361485",
    },
    {
      cell_output: {
        capacity: "0x98049e1d02f",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x",
      out_point: {
        index: "0x1",
        tx_hash:
          "0x0f1cf3ddefa6141d16375dfefc9ac3bef40fd7698e206925ee9df4c809ea1958",
      },
      block_number: "0x361489",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const upgradeBinary = Uint8Array.of(1, 2, 3);
  const upgradeOptions = {
    cellProvider: cellProvider,
    scriptBinary: upgradeBinary,
    outputScriptLock: outputScriptLock,
    typeId: {
      code_hash:
        "0x00000000000000000000000000000000000000000000000000545950455f4944",
      hash_type: "type" as const,
      args:
        "0x2c82a38950de3204a4ae166c50331d1b104e97a21402cb5bdb7ca23bb9c15f0f",
    },
    config: AGGRON4,
  };

  let { txSkeleton } = await generateUpgradeTypeIdDataTx(upgradeOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xba156565d15e8728e78bb47abbfa71b9b586a0abb17cc7a62994c0cdcffcfa27",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});
