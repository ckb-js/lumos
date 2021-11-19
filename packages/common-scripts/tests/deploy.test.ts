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
        capacity: "0x1de5375e94",
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
          "0x0a903e8c8356d73742c701b97eab42a801d18d5f97d8e3eaf7f9740549c3b42e",
      },
      block_number: "0x351850",
    },
    {
      cell_output: {
        capacity: "0xe367d9bd40",
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
          "0xb370a2c840f4896bb592d6bab87062373169429b32dfd6d58ac344956e2d414a",
      },
      block_number: "0x35187d",
    },
    {
      cell_output: {
        capacity: "0xe367d9bd40",
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
          "0xb370a2c840f4896bb592d6bab87062373169429b32dfd6d58ac344956e2d414a",
      },
      block_number: "0x35187d",
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
    t.is(type, undefined);
  }
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xda602594d62d21bdc5f4a0209ae4e3c1619e7191032dfb554ac941bd5ccb797f",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("deploy with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0xe95dbabac5",
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
          "0x9508b6d19403897c67ac6e6bc491c2d74b884a3a1c267955c9c03d6c8320890b",
      },
      block_number: "0x351a14",
    },
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
    t.is(type, undefined);
  }
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0xd2b09428c4b0276fd624972cc944f308b591595fb1cef19f961c652763f19b78",
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
