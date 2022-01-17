import { Cell, JSBI, Script } from "@ckb-lumos/base";
import { common } from "@ckb-lumos/common-scripts";
import test from "ava";
import { CellProvider } from "./cell_provider";
import deploy from "../src/deploy";
const { __tests__ } = deploy;
const { calculateTxFee } = __tests__;
import { predefined } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
const { AGGRON4 } = predefined;

const FROMADDRESS = "ckt1qyqptxys5l9vk39ft0hswscxgseawc77y2wqlr558h";
const OUTPUTSCRIPTLOCK: Script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x159890a7cacb44a95bef0743064433d763de229c",
};
const LOCKARG1 = "0x3d35d87fac0008ba5b12ee1c599b102fc8f5fdf8";
const LOCKARG2 = "0x99dbe610c43186696e1f88cb7b59252d4c92afda";
const LOCKARG3 = "0xc055df68fdd47c6a5965b9ab21cd6825d8696a76";
const FROMINFO = {
  R: 2,
  M: 2,
  publicKeyHashes: [LOCKARG1, LOCKARG2, LOCKARG3],
};
const MULTISIGSCRIPT = {
  code_hash:
    "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
  hash_type: "type",
  args: "0xed20af7322823d0dc33bfb215486a05082669905",
};
const SCRIPTBINARY = Uint8Array.of(1);

function getTxFee(txSkeleton: TransactionSkeletonType): JSBI {
  const inputCapacity = txSkeleton
    .get("inputs")
    .map((c) => JSBI.BigInt(c.cell_output.capacity))
    .reduce((a, b) => JSBI.add(a, b), JSBI.BigInt(0));
  const outputCapacity = txSkeleton
    .get("outputs")
    .map((c) => JSBI.BigInt(c.cell_output.capacity))
    .reduce((a, b) => JSBI.add(a, b), JSBI.BigInt(0));
  const txFee = JSBI.subtract(inputCapacity, outputCapacity);
  return txFee;
}

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

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
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMADDRESS,
    config: AGGRON4,
  };

  let { txSkeleton } = await deploy.generateDeployWithDataTx(deployOptions);

  for (const input of txSkeleton.get("inputs")) {
    const type = input.cell_output.type;
    const data = input.data;
    t.is(type, undefined);
    t.is(data, "0x");
  }

  const txFee = getTxFee(txSkeleton);
  const expectTxFee = calculateTxFee(txSkeleton, JSBI.BigInt(1000));
  t.is(txFee.toString(), expectTxFee.toString());
  t.true(JSBI.lessThan(txFee, JSBI.BigInt(1000000)));

  const deployLock = txSkeleton.outputs.get(0)!.cell_output.lock!;
  const changeLock = txSkeleton.outputs.get(1)!.cell_output.lock!;
  t.deepEqual(deployLock, OUTPUTSCRIPTLOCK);
  t.deepEqual(changeLock, OUTPUTSCRIPTLOCK);

  const deployData = txSkeleton.outputs.get(0)!.data;
  t.is(deployData, "0x01");
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
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMADDRESS,
    config: AGGRON4,
  };

  let { txSkeleton } = await deploy.generateDeployWithTypeIdTx(deployOptions);

  for (const input of txSkeleton.get("inputs")) {
    const type = input.cell_output.type;
    const data = input.data;
    t.is(type, undefined);
    t.is(data, "0x");
  }

  const txFee = getTxFee(txSkeleton);
  const expectTxFee = calculateTxFee(txSkeleton, JSBI.BigInt(1000));
  t.is(txFee.toString(), expectTxFee.toString());
  t.true(JSBI.lessThan(txFee, JSBI.BigInt(1000000)));

  const deployLock = txSkeleton.outputs.get(0)!.cell_output.lock!;
  const changeLock = txSkeleton.outputs.get(1)!.cell_output.lock!;
  t.deepEqual(deployLock, OUTPUTSCRIPTLOCK);
  t.deepEqual(changeLock, OUTPUTSCRIPTLOCK);

  const deployData = txSkeleton.outputs.get(0)!.data;
  t.is(deployData, "0x01");
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
    fromInfo: FROMADDRESS,
    typeId: {
      code_hash:
        "0x00000000000000000000000000000000000000000000000000545950455f4944",
      hash_type: "type" as const,
      args:
        "0x2c82a38950de3204a4ae166c50331d1b104e97a21402cb5bdb7ca23bb9c15f0f",
    },
    config: AGGRON4,
  };

  let { txSkeleton } = await deploy.generateUpgradeTypeIdDataTx(upgradeOptions);

  const txFee = getTxFee(txSkeleton);
  const expectTxFee = calculateTxFee(txSkeleton, JSBI.BigInt(1000));
  t.is(txFee.toString(), expectTxFee.toString());
  t.true(JSBI.lessThan(txFee, JSBI.BigInt(1000000)));

  const deployLock = txSkeleton.outputs.get(0)!.cell_output.lock!;
  const changeLock = txSkeleton.outputs.get(1)!.cell_output.lock!;
  t.deepEqual(deployLock, OUTPUTSCRIPTLOCK);
  t.deepEqual(changeLock, OUTPUTSCRIPTLOCK);

  const deployData = txSkeleton.outputs.get(0)!.data;
  t.is(deployData, "0x010203");
});

test("upgrade contract with size reduced", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x5f5e10000",
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
      data: "0x01010101010101",
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
  const upgradeBinary = Uint8Array.of(1);
  const upgradeOptions = {
    cellProvider: cellProvider,
    scriptBinary: upgradeBinary,
    fromInfo: FROMADDRESS,
    typeId: {
      code_hash:
        "0x00000000000000000000000000000000000000000000000000545950455f4944",
      hash_type: "type" as const,
      args:
        "0x2c82a38950de3204a4ae166c50331d1b104e97a21402cb5bdb7ca23bb9c15f0f",
    },
    config: AGGRON4,
  };

  let { txSkeleton } = await deploy.generateUpgradeTypeIdDataTx(upgradeOptions);

  const txFee = getTxFee(txSkeleton);
  const expectTxFee = calculateTxFee(txSkeleton, JSBI.BigInt(1000));
  t.is(txFee.toString(), expectTxFee.toString());
  t.true(JSBI.lessThan(txFee, JSBI.BigInt(1000000)));

  const deployLock = txSkeleton.outputs.get(0)!.cell_output.lock!;
  const changeLock = txSkeleton.outputs.get(1)!.cell_output.lock!;
  t.deepEqual(deployLock, OUTPUTSCRIPTLOCK);
  t.deepEqual(changeLock, OUTPUTSCRIPTLOCK);

  const deployData = txSkeleton.outputs.get(0)!.data;
  t.is(deployData, "0x01");
});

test("deploy with data by multisig", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x1718c7e00",
        lock: {
          args: "0xed20af7322823d0dc33bfb215486a05082669905",
          code_hash:
            "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
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
          args: "0xed20af7322823d0dc33bfb215486a05082669905",
          code_hash:
            "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
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
        capacity: "0xdf0743f080",
        lock: {
          args: "0xed20af7322823d0dc33bfb215486a05082669905",
          code_hash:
            "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
          hash_type: "type",
        },
        type: undefined,
      },
      data: "0x",
      out_point: {
        index: "0x1",
        tx_hash:
          "0xcaa553f8a2b973e8fb3c88c87742e52ba5d310663dcf9bca435a7572c02e9b81",
      },
      block_number: "0x36f668",
    },
  ];
  const cellProvider = new CellProvider(inputs);
  const deployOptions = {
    cellProvider: cellProvider,
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMINFO,
    config: AGGRON4,
  };

  let { txSkeleton } = await deploy.generateDeployWithDataTx(deployOptions);

  for (const input of txSkeleton.get("inputs")) {
    const type = input.cell_output.type;
    const data = input.data;
    t.is(type, undefined);
    t.is(data, "0x");
  }

  const txFee = getTxFee(txSkeleton);
  const expectTxFee = calculateTxFee(txSkeleton, JSBI.BigInt(1000));
  t.is(txFee.toString(), expectTxFee.toString());
  t.true(JSBI.lessThan(txFee, JSBI.BigInt(1000000)));

  const deployLock = txSkeleton.outputs.get(0)!.cell_output.lock!;
  const changeLock = txSkeleton.outputs.get(1)!.cell_output.lock!;
  t.deepEqual(deployLock, MULTISIGSCRIPT);
  t.deepEqual(changeLock, MULTISIGSCRIPT);

  const deployData = txSkeleton.outputs.get(0)!.data;
  t.is(deployData, "0x01");

  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const signingEntries = {
    type: "witness_args_lock",
    index: 0,
    message:
      "0x156e0322b21018c83ad7dfbc32f35128d0e374d43308643febf9453b262123c7",
  };
  t.deepEqual(txSkeleton.get("signingEntries").get(0), signingEntries);
});

test("collected capacity is enough for change cell and deploy cell", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x2e318fc00",
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
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMADDRESS,
    config: AGGRON4,
  };
  const { txSkeleton } = await deploy.generateDeployWithDataTx(deployOptions);
  const changeCapacity = txSkeleton.outputs.get(1)!.cell_output.capacity!;
  t.is(changeCapacity, "0x1718c7c0a");
});

test("collected capacity is NOT enough for change cell and deploy cell", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x165a0bc00",
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
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMADDRESS,
    config: AGGRON4,
  };
  const error = await t.throwsAsync(() =>
    deploy.generateDeployWithDataTx(deployOptions)
  );
  t.is(error.message, "Not enough capacity in from address!");
});

test("collected capacity is enough for deploy cell but NOT enough for change cell", async (t) => {
  const inputs: Cell[] = [
    {
      cell_output: {
        capacity: "0x2cb417800",
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
    scriptBinary: SCRIPTBINARY,
    fromInfo: FROMADDRESS,
    config: AGGRON4,
  };
  const error = await t.throwsAsync(() =>
    deploy.generateDeployWithDataTx(deployOptions)
  );
  t.is(error.message, "Not enough capacity in from address!");
});
