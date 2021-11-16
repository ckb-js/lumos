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
        capacity: "0x300e66100",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0xf74a4189a77e8b2fce282785a10f27bbb5b02fb5f56812cc1e59cfbc71d298e6",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x010203",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x344845672f22843272f614c805a48fab5b2f533f3088004c0504c408063cb7cd",
      },
      block_number: "0x34a348",
    },
    {
      cell_output: {
        capacity: "0x2dd231b00",
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
          "0xe287f6749924309ef21cc268a7ecbfac4c33554929c5c32310f9a75623355114",
      },
      block_number: "0x3483db",
    },
    {
      cell_output: {
        capacity: "0xe8d4a51000",
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
          "0x0c6bc13b6ac76d201057bd21e501d3db5b5e06ca3edcb258be298241ea6fad6d",
      },
      block_number: "0x3483e4",
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
          "0xfdcb03d2fc8aad19b941082d7b564d1b69c0e6d3528789ed7e67764ec4c29d30",
      },
      block_number: "0x34a0d8",
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
      "0x7e0de42f8021e616d5fd2730f53993b97accf6aae15da8f4750c21cd4be10a2f",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("deploy with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x300e66100",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0xf74a4189a77e8b2fce282785a10f27bbb5b02fb5f56812cc1e59cfbc71d298e6",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x010203",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x344845672f22843272f614c805a48fab5b2f533f3088004c0504c408063cb7cd",
      },
      block_number: "0x34a348",
    },
    {
      cell_output: {
        capacity: "0x177825f00",
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
          "0xfdcb03d2fc8aad19b941082d7b564d1b69c0e6d3528789ed7e67764ec4c29d30",
      },
      block_number: "0x34a0d8",
    },
    {
      cell_output: {
        capacity: "0x2045308dff",
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
          "0xfdcb03d2fc8aad19b941082d7b564d1b69c0e6d3528789ed7e67764ec4c29d30",
      },
      block_number: "0x34a0d8",
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
          "0x6e32e395448360ac000a79dc7d78977e1c19ae1e5c68a78dca2538cf9527ece4",
      },
      block_number: "0x34a12d",
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
      "0xad7ec5dce4f5f83752e81d99d24a7faaf8112d29fb53eef4763b466211f81d6c",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("upgrade with typeID", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x300e66100",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args:
            "0xf74a4189a77e8b2fce282785a10f27bbb5b02fb5f56812cc1e59cfbc71d298e6",
          code_hash:
            "0x00000000000000000000000000000000000000000000000000545950455f4944",
          hash_type: "type",
        },
      },
      data: "0x010203",
      out_point: {
        index: "0x0",
        tx_hash:
          "0x344845672f22843272f614c805a48fab5b2f533f3088004c0504c408063cb7cd",
      },
      block_number: "0x34a348",
    },
    {
      cell_output: {
        capacity: "0xea403bad00",
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
          "0x105d298171cff7941e02aa0487eecc3be66be22fc68196cfc57ef1dbe1a8945a",
      },
      block_number: "0x34a169",
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
        "0xf74a4189a77e8b2fce282785a10f27bbb5b02fb5f56812cc1e59cfbc71d298e6",
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
      "0xa3d58c13496af26f5ad25b6b0d341b6e2f7e362555ef05cf297e970e0efbe841",
  };

  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});
