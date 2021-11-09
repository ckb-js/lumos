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
        capacity: "0x2ecbd7b794",
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
        index: "0x0",
        tx_hash:
          "0x485f6462df3e37b9c62bd465d25f3fb1ffa0cfd90609b268dc7f7ac91f0555cd",
      },
      block_number: "0x24",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
  };

  let txSkeleton = await generateDeployWithDataTx(deployOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x104d32b03be1b0b24b6736296f2bb6604f576c85e6c666bad09c0b91f062de60",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("deploy with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x2ecbd7b794",
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
        index: "0x0",
        tx_hash:
          "0x485f6462df3e37b9c62bd465d25f3fb1ffa0cfd90609b268dc7f7ac91f0555cd",
      },
      block_number: "0x24",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
  };

  let txSkeleton = await generateDeployWithTypeIdTx(deployOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xab551759413b1e6536580500939503bb8f2b49757f7fff5ec23f6ef5caa32d4b",
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
            "0x7abcd9f949a16b40ff5b50b56e62d2a6a007e544d8491bb56476693b6c45fd27",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x01",
      out_point: {
        index: "0x0",
        tx_hash:
          "0xc89e42c6b88a1c7625ccd24154358fe5e75b39091a848e59ac7f9eaeb7a70285",
      },
      block_number: "0x334d6f",
    },
    {
      cell_output: {
        capacity: "0x20571233ca",
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
          "0xc89e42c6b88a1c7625ccd24154358fe5e75b39091a848e59ac7f9eaeb7a70285",
      },
      block_number: "0x334d6f",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const upgradeOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    typeId: {
      code_hash:
        "0x00000000000000000000000000000000000000000000000000545950455f4944",
      hash_type: "type" as const,
      args:
        "0x7abcd9f949a16b40ff5b50b56e62d2a6a007e544d8491bb56476693b6c45fd27",
    },
    config: AGGRON4,
  };

  let txSkeleton = await generateUpgradeTypeIdDataTx(upgradeOptions);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xe7582f02e85d259a523aa75348c7c275d8a389412cf5c09c6d511b20304eac7e",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});
