import { Cell, Script } from "@ckb-lumos/base";
import { common } from "@ckb-lumos/common-scripts";
const { __tests__ } = common;
const { getTransactionSize, calculateFee } = __tests__;
import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  generateDeployWithDataTx,
  generateDeployWithTypeIdTx,
  generateUpgradeTypeIdDataTx,
  payFee,
} from "../src/deploy";
import { predefined } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
const { AGGRON4 } = predefined;

const fromAddress = "ckt1qyqptxys5l9vk39ft0hswscxgseawc77y2wqlr558h";
const outputScriptLock: Script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x159890a7cacb44a95bef0743064433d763de229c",
};
const scriptBinary = Uint8Array.of(1);

async function payTxFee(
  txSkeleton: TransactionSkeletonType
): Promise<TransactionSkeletonType> {
  const feeRate = BigInt(1000);
  let size: number = 0;
  let newTxSkeleton: TransactionSkeletonType = txSkeleton;

  let currentTransactionSize: number = getTransactionSize(newTxSkeleton);
  while (currentTransactionSize > size) {
    size = currentTransactionSize;
    const fee: bigint = calculateFee(size, feeRate);

    newTxSkeleton = await payFee(txSkeleton, fromAddress, fee, {
      config: AGGRON4,
    });
    currentTransactionSize = getTransactionSize(newTxSkeleton);
  }

  return newTxSkeleton;
}

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
        capacity: "0x1c73aae094",
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
          "0xf87fbaa684aa3e8afcc97bf4a03ccfbf55e810e4c72da33a3dc6f21be25b2bdc",
      },
      block_number: "0x3525a6",
    },
    {
      cell_output: {
        capacity: "0xe367d9bace",
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
        index: "0x2",
        tx_hash:
          "0xf87fbaa684aa3e8afcc97bf4a03ccfbf55e810e4c72da33a3dc6f21be25b2bdc",
      },
      block_number: "0x3525a6",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4,
  };

  let txSkeleton = await generateDeployWithDataTx(deployOptions);
  txSkeleton = await payTxFee(txSkeleton);
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
      "0x255ec269ca02c08c8ce07b7e4e064ff15f99eeccb7a12f9241e4222d5a7b71cf",
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
        capacity: "0xe668c01bc5",
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
          "0x46176211dd8ea0bfaa652a08de97992fec25d243411fec63826c7ee989491d97",
      },
      block_number: "0x3525b6",
    },
    {
      cell_output: {
        capacity: "0x1718c7b39",
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
        index: "0x2",
        tx_hash:
          "0x46176211dd8ea0bfaa652a08de97992fec25d243411fec63826c7ee989491d97",
      },
      block_number: "0x3525b6",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: scriptBinary,
    outputScriptLock: outputScriptLock,
    config: AGGRON4,
  };

  let txSkeleton = (await generateDeployWithTypeIdTx(deployOptions))[1];
  txSkeleton = await payTxFee(txSkeleton);
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
      "0x2159d2bd73e2b0961895e68d3d8890bc718ad4250ed3b4ed4eed51cb4daf15e3",
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
        capacity: "0x18f59e300",
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
          "0xa11728dd5b27224179c19e831f8e8dc0c67835bcd2d5d3bb87c7cc27d0b66cfc",
      },
      block_number: "0x352583",
    },
    {
      cell_output: {
        capacity: "0x2540be18e",
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
        index: "0x2",
        tx_hash:
          "0xa11728dd5b27224179c19e831f8e8dc0c67835bcd2d5d3bb87c7cc27d0b66cfc",
      },
      block_number: "0x352583",
    },
    {
      cell_output: {
        capacity: "0x2540be18e",
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
        index: "0x2",
        tx_hash:
          "0xa11728dd5b27224179c19e831f8e8dc0c67835bcd2d5d3bb87c7cc27d0b66cfc",
      },
      block_number: "0x352583",
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
        "0xe9451f3528af55247ff7d3851a00b54a5fe7de38d40dc29580ce2c069332633a",
    },
    config: AGGRON4,
  };

  let txSkeleton = await generateUpgradeTypeIdDataTx(upgradeOptions);
  txSkeleton = await payTxFee(txSkeleton);
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x5a16f2d3dfad60a13c1d4c869e3a2fefe4edc214199794ab6d6a93a904b1a054",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});
