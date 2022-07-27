import test from "ava";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
  Options,
} from "@ckb-lumos/helpers";
import {
  locktimePool,
  LocktimeCell,
  FromInfo,
  secp256k1Blake160Multisig,
} from "../src";
const { prepareSigningEntries, payFee } = locktimePool;
import { CellProvider } from "./cell_provider";
import { List } from "immutable";
import { DEV_CONFIG } from "./dev_config";
import { Config, predefined } from "@ckb-lumos/config-manager";
import {
  Header,
  Cell,
  CellCollector,
  Script,
  since as SinceUtils,
} from "@ckb-lumos/base";
import { parseFromInfo } from "../src/from_info";
import {
  bobMultisigInputs,
  bobSecpDaoDepositInput,
  bobSecpDaoWithdrawInput,
  tipHeader as inputTipHeader,
} from "./inputs";
import { bob } from "./account_info";
import { transferCompatible } from "../lib/locktime_pool";
import { calculateMaximumWithdrawCompatible } from "../lib/dao";
import { BI } from "@ckb-lumos/bi";
const { AGGRON4 } = predefined;

const originCapacity = "0x174876e800";
const inputInfos: LocktimeCell[] = [
  {
    // multisig
    cellOutput: {
      capacity: "0x" + BigInt("100000000000").toString(16),
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: undefined,
    },
    outPoint: {
      txHash:
        "0xb4f92e2a74905ca2d24b952e782c42f35f18893cb56e46728857a926a893f41f",
      index: "0x0",
    },
    blockHash:
      "0x62e03ef430cb72041014224417de08caf73d4e804eaca7813c2015abcd6afe1a",
    blockNumber: "0x1aee1",
    data: "0x",
    since: "0x0",
    depositBlockHash: undefined,
    withdrawBlockHash: undefined,
    sinceValidationInfo: {
      epoch: "0xa0005002b16",
      blockNumber: "0x1aee1",
      // timestamp: "0x172b7721b70",
      median_timestamp: "",
    },
  },
  {
    // multisig
    cellOutput: {
      capacity: "0x" + BigInt("100000000000").toString(16),
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8152b00c000f00020",
      },
      type: undefined,
    },
    outPoint: {
      txHash:
        "0x7d18dee8cf66bdc4721d18207dc18434f1d68af75537c89f97cb8618de73d871",
      index: "0x0",
    },
    blockHash:
      "0xee89cacb5ff0dd3edcca3904619693355396536cce45658bf9a9c676ae3819c3",
    blockNumber: "0x1aedd",
    data: "0x",
    since: "0x2000f000c0002b15",
    depositBlockHash: undefined,
    withdrawBlockHash: undefined,
    sinceValidationInfo: {
      epoch: "0xa0001002b16",
      blockNumber: "0x1aedd",
      // timestamp: "0x172b6608868",
      median_timestamp: "",
    },
  },
  {
    // default lock, dao
    cellOutput: {
      capacity: "0x" + BigInt("100007690204").toString(16),
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: {
        codeHash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hashType: "type",
        args: "0x",
      },
    },
    outPoint: {
      txHash:
        "0x42300d78faea694e0e1c2316de091964a0d976a4ed27775597bad2d43a3e17da",
      index: "0x0",
    },
    blockHash:
      "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
    blockNumber: "0x1929c",
    data: "0x4992010000000000",
    since: "0x20000a00050028ee",
    depositBlockHash:
      "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    withdrawBlockHash:
      "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
    sinceValidationInfo: undefined,
  },
];

const depositDao =
  "0x8eedf002d7c88852433518952edc28002dd416364532c50800d096d05aac0200";
const withdrawDao =
  "0x39d32247d33f90523d37dae613dd280037e9cc1d7b01c708003d8849d8ac0200";

class LocktimeCellCollector {
  private fromInfo: FromInfo;
  private config: Config;
  readonly fromScript: Script;

  constructor(
    fromInfo: FromInfo,
    _: any,
    { config = undefined }: Options = {}
  ) {
    this.fromInfo = fromInfo;
    this.config = config!;
    this.fromScript = {
      codeHash: "",
      hashType: "data",
      args: "",
    };
  }

  async *collect() {
    const { fromScript } = parseFromInfo(this.fromInfo, {
      config: this.config,
    });
    for (const info of inputInfos) {
      const lock = info.cellOutput.lock;
      if (
        lock.codeHash === fromScript.codeHash &&
        lock.hashType === fromScript.hashType
      ) {
        yield info;
      }
    }
  }
}

const cellProvider = new CellProvider([]);
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

const tipHeader: Header = {
  compactTarget: "0x20010000",
  dao: "0x443110aefc4d1b55b10353894c2a29001e664c552fd16409005ef48f09d50200",
  epoch: "0xa0007002b16",
  hash: "0xf77591af1c30a65d5aec4c4753a3e967ecbcb850f90a9a63f59a4e513029d135",
  nonce: "0x8d543978c6abec5d9924183a39e2eeb0",
  number: "0x1aee3",
  parentHash:
    "0x421f28afb4187d8034bb3895b671aa183e759f23036a744c792ff9c90b293c9d",
  proposalsHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x172b772235e",
  transactionsRoot:
    "0xb8b4cee50a21a4c494d8eb4e34f6232fa72129fa9d7a2e4b09417ae224a43ebd",
  extraHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};
const aliceAddress = "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v";
const bobAddress = "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83";

const fromInfo: FromInfo = {
  R: 0,
  M: 1,
  publicKeyHashes: ["0x36c329ed630d6ce750712a477543672adab57f4c"],
};

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("JSBI:transferCompatible multisig", async (t) => {
  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(500 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);
  t.is(txSkeleton.get("inputSinces").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").size, 0);
});

test("JSBI:prepareSigningEntries, multisig", async (t) => {
  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(500 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  txSkeleton = prepareSigningEntries(txSkeleton, { config: DEV_CONFIG });

  t.is(txSkeleton.get("signingEntries").size, 1);

  const expectedMessage =
    "0x185fb55177cefec3187c681889d10f85bb142400bf9817dd68b4efb5b51b9b04";

  const signingEntry = txSkeleton.get("signingEntries").get(0)!;
  t.is(signingEntry.index, 0);
  t.is(signingEntry.type, "witness_args_lock");
  t.is(signingEntry.message, expectedMessage);
});

test("JSBI:transferCompatible multisig & dao", async (t) => {
  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(2500 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const interest = calculateMaximumWithdrawCompatible(
    {
      ...inputInfos[2],
      cellOutput: {
        ...inputInfos[2].cellOutput,
        capacity: originCapacity,
      },
    },
    depositDao,
    withdrawDao
  ).sub(originCapacity);

  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());
  t.is(
    interest.toString(),
    sumOfInputCapacity
      .sub(BI.from(originCapacity).mul(txSkeleton.get("inputs").size))
      .toString()
  );

  t.is(txSkeleton.get("inputs").size, 3);
  t.is(txSkeleton.get("witnesses").size, 3);
  t.is(txSkeleton.get("inputSinces").size, 3);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 2);

  const expectedWitnesses = [
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0x61000000100000005500000061000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000",
  ];

  t.true(txSkeleton.get("witnesses").equals(List(expectedWitnesses)));
});

test("JSBI.prepareSigningEntries, multisig & dao", async (t) => {
  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(2500 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  txSkeleton = await prepareSigningEntries(txSkeleton, { config: DEV_CONFIG });

  t.is(txSkeleton.get("signingEntries").size, 3);

  const expectedMessages = [
    "0x98d2c7a0f7293f7cc95383f9bfd3559db148b661559684b2109c3ee22dc261f6",
    "0x98d2c7a0f7293f7cc95383f9bfd3559db148b661559684b2109c3ee22dc261f6",
    "0x8c34fa355fc0b13cca51e3a9ee9926b1f35795dc22f986d5596fc443321bdc44",
  ];

  expectedMessages.forEach((expectedMessage, index) => {
    const message = txSkeleton
      .get("signingEntries")
      .find((s) => s.type === "witness_args_lock" && s.index === index)!
      .message;
    t.is(message, expectedMessage);
  });
});

test("JSBI:payFee, multisig & dao", async (t) => {
  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(2500 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  const fee = BI.from(1 * 10 ** 8);
  txSkeleton = await payFee(
    txSkeleton,
    [fromInfo, aliceAddress],
    BI.from(fee),
    tipHeader,
    {
      config: DEV_CONFIG,
      LocktimeCellCollector,
    }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const interest = calculateMaximumWithdrawCompatible(
    {
      ...inputInfos[2],
      cellOutput: {
        ...inputInfos[2].cellOutput,
        capacity: originCapacity,
      },
    },
    depositDao,
    withdrawDao
  ).sub(originCapacity);
  console.log(fee);
  console.log(sumOfInputCapacity);
  console.log(sumOfOutputCapacity);
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.sub(fee).toString());
  t.is(
    interest.toString(),
    sumOfInputCapacity
      .sub(BI.from(originCapacity).mul(txSkeleton.get("inputs").size))
      .toString()
  );

  t.is(txSkeleton.get("inputs").size, 3);
  t.is(txSkeleton.get("witnesses").size, 3);
  t.is(txSkeleton.get("inputSinces").size, 3);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 2);
});

test("JSBI:Don't update capacity directly when deduct", async (t) => {
  class LocktimeCellCollector {
    private fromInfo: FromInfo;
    private config: Config;
    readonly fromScript: Script;

    constructor(
      fromInfo: FromInfo,
      _: any,
      { config = undefined }: Options = {}
    ) {
      this.fromInfo = fromInfo;
      this.config = config!;
      this.fromScript = {
        codeHash: "",
        hashType: "data",
        args: "",
      };
    }

    async *collect() {
      const { fromScript } = parseFromInfo(this.fromInfo, {
        config: this.config,
      });
      for (const info of [inputInfos[0]]) {
        const lock = info.cellOutput.lock;
        if (
          lock.codeHash === fromScript.codeHash &&
          lock.hashType === fromScript.hashType
        ) {
          yield info;
        }
      }
    }
  }

  txSkeleton = await transferCompatible(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BI.from(BI.from(600 * 10 ** 8)),
    tipHeader,
    { config: DEV_CONFIG, LocktimeCellCollector }
  );

  const getCapacities = (cells: List<Cell>): string[] => {
    return cells.map((c) => c.cellOutput.capacity).toJS() as string[];
  };

  const inputCapacitiesBefore = getCapacities(txSkeleton.get("inputs"));
  const outputCapacitiesBefore = getCapacities(txSkeleton.get("outputs"));

  let errFlag: boolean = false;
  try {
    await transferCompatible(
      txSkeleton,
      [fromInfo, aliceAddress],
      bobAddress,
      BI.from(BI.from(500 * 10 ** 8)),
      tipHeader,
      { config: DEV_CONFIG, LocktimeCellCollector }
    );
  } catch {
    errFlag = true;
  }

  const inputCapacitiesAfter = getCapacities(txSkeleton.get("inputs"));
  const outputCapacitiesAfter = getCapacities(txSkeleton.get("outputs"));

  t.true(errFlag);
  t.deepEqual(inputCapacitiesBefore, inputCapacitiesAfter);
  t.deepEqual(outputCapacitiesBefore, outputCapacitiesAfter);
});

const depositHeader = {
  compactTarget: "0x20010000",
  dao: "0x8eedf002d7c88852433518952edc28002dd416364532c50800d096d05aac0200",
  epoch: "0xa000500283a",
  hash: "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
  nonce: "0x98e10e0a992f7274c7dc0c62e9d42f02",
  number: "0x19249",
  parentHash:
    "0xd4f3e8725de77aedadcf15755c0f6cdd00bc8d4a971e251385b59ce8215a5d70",
  proposalsHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x17293289266",
  transactionsRoot:
    "0x9294a800ec389d1b0d9e7c570c249da260a44cc2790bd4aa250f3d5c83eb8cde",
  extraHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};
const withdrawHeader = {
  compactTarget: "0x20010000",
  dao: "0x39d32247d33f90523d37dae613dd280037e9cc1d7b01c708003d8849d8ac0200",
  epoch: "0xa0008002842",
  hash: "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
  nonce: "0x7ffb49f45f12f2b30ac45586ecf13de2",
  number: "0x1929c",
  parentHash:
    "0xfe601308a34f1faf68906d2338e60246674ed1f1fbbad3d8471daca21a11cdf7",
  proposalsHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x1729cdd69c9",
  transactionsRoot:
    "0x467d72af12af6cb122985f9838bfc47073bba30cc37a4075aef54b0f0768f384",
  extraHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class RpcMocker {
  constructor() {}

  async getHeader(hash: string) {
    if (hash === depositHeader.hash) {
      return depositHeader;
    }
    if (hash === withdrawHeader.hash) {
      return withdrawHeader;
    }

    throw new Error(`Error header hash!`);
  }

  async getTransaction(hash: string): Promise<any> {
    if (hash === bobSecpDaoWithdrawInput.outPoint!.txHash) {
      return {
        txStatus: {
          blockHash: bobSecpDaoWithdrawInput.blockHash,
        },
        transaction: {
          inputs: [
            {
              previousOutput: bobSecpDaoDepositInput.outPoint,
            },
          ],
        },
      };
    }

    if (hash === bobSecpDaoDepositInput.outPoint!.txHash) {
      return {
        txStatus: {
          blockHash: bobSecpDaoDepositInput.blockHash,
        },
      };
    }

    throw new Error("Error transaction hash!");
  }
}

function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

async function collectAllCells(collector: CellCollector): Promise<Cell[]> {
  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  return cells;
}

test("CellCollector, dao, invalid", async (t) => {
  const cellProvider = new CellProvider([bobSecpDaoWithdrawInput]);
  const tipHeader = cloneObject(inputTipHeader);
  const epochValue = { length: 10, index: 4, number: 10478 };
  const epoch = SinceUtils.generateHeaderEpoch(epochValue);
  tipHeader.epoch = epoch;
  const collector = new locktimePool.CellCollector(
    bob.testnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const cells = await collectAllCells(collector);

  t.is(cells.length, 0);
});

test("CellCollector, multisig", async (t) => {
  const tipHeader = inputTipHeader;
  const epochValue = { length: 653, index: 174, number: 318 };
  const since = SinceUtils.generateSince({
    relative: false,
    type: "epochNumber",
    value: epochValue,
  });
  const multisigScript = secp256k1Blake160Multisig.serializeMultisigScript(
    bob.fromInfo
  );
  const args = secp256k1Blake160Multisig.multisigArgs(multisigScript, since);
  const input: Cell = cloneObject(bobMultisigInputs[0]);
  input.cellOutput.lock.args = args;
  // For using RpcMocker
  input.blockHash = withdrawHeader.hash;

  const cellProvider = new CellProvider([input]);

  const collector = new locktimePool.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const cells = await collectAllCells(collector);

  t.is(cells.length, 1);
  const cell = cells[0]! as LocktimeCell;
  t.is(cell.cellOutput.capacity, bobMultisigInputs[0]!.cellOutput.capacity);
  t.is(cell.blockHash, withdrawHeader.hash);
  t.is(cell.since, since);
  t.deepEqual(cell.sinceValidationInfo, {
    epoch: withdrawHeader.epoch,
    blockNumber: withdrawHeader.number,
    // timestamp: withdrawHeader.timestamp,
    median_timestamp: "",
  });
});

test("CellCollector, multisig, timestamp should be skipped", async (t) => {
  const tipHeader = inputTipHeader;
  const since = SinceUtils.generateSince({
    relative: false,
    type: "blockTimestamp",
    value: BI.from(BI.from(0)),
  });
  const multisigScript = secp256k1Blake160Multisig.serializeMultisigScript(
    bob.fromInfo
  );
  const args = secp256k1Blake160Multisig.multisigArgs(multisigScript, since);
  const input: Cell = cloneObject(bobMultisigInputs[0]);
  input.cellOutput.lock.args = args;
  // For using RpcMocker
  input.blockHash = withdrawHeader.hash;

  const cellProvider = new CellProvider([input]);

  const collector = new locktimePool.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const cells = await collectAllCells(collector);

  t.is(cells.length, 0);
});

test("CellCollector, dao & multisig, dao since > multisig since", async (t) => {
  const tipHeader = cloneObject(inputTipHeader);

  const epochValue = { length: 10, index: 4, number: 10478 };
  const multisigSince = SinceUtils.generateSince({
    relative: false,
    type: "epochNumber",
    value: epochValue,
  });
  const daoEpochValue = { length: 10, index: 5, number: 10478 };
  const daoSince = SinceUtils.generateSince({
    relative: false,
    type: "epochNumber",
    value: daoEpochValue,
  });
  const multisigScript = secp256k1Blake160Multisig.serializeMultisigScript(
    bob.fromInfo
  );
  const args = secp256k1Blake160Multisig.multisigArgs(
    multisigScript,
    multisigSince
  );
  const depositCell: Cell = cloneObject(bobSecpDaoDepositInput);
  const withdrawCell: Cell = cloneObject(bobSecpDaoWithdrawInput);

  const multisigLock: Script = {
    codeHash:
      "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hashType: "type",
    args,
  };

  depositCell.cellOutput.lock = cloneObject(multisigLock);
  depositCell.blockHash = depositHeader.hash;
  withdrawCell.cellOutput.lock = cloneObject(multisigLock);
  withdrawCell.blockHash = withdrawHeader.hash;

  const headerEpochValue = { length: 10, index: 5, number: 10479 };
  const epoch = SinceUtils.generateHeaderEpoch(headerEpochValue);
  tipHeader.epoch = epoch;

  const cellProvider = new CellProvider([withdrawCell]);
  const collector = new locktimePool.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const maximumWithdrawCapacity = calculateMaximumWithdrawCompatible(
    withdrawCell,
    depositHeader.dao,
    withdrawHeader.dao
  );

  const cells = await collectAllCells(collector);

  t.is(cells.length, 1);

  const cell = cells[0]! as LocktimeCell;

  t.is(cell.depositBlockHash, depositHeader.hash);
  t.is(cell.withdrawBlockHash, withdrawHeader.hash);
  t.is(cell.blockHash, withdrawHeader.hash);
  t.is(cell.blockNumber, withdrawHeader.number);

  // t.is(cell.since, multisigSince)
  t.is(cell.since, daoSince);
  t.is(
    BI.from(cell.cellOutput.capacity).toString(),
    maximumWithdrawCapacity.toString()
  );
});

test("CellCollector, dao & multisig, multisig since > dao since", async (t) => {
  const tipHeader = cloneObject(inputTipHeader);

  const epochValue = { length: 10, index: 6, number: 10478 };
  const multisigSince = SinceUtils.generateSince({
    relative: false,
    type: "epochNumber",
    value: epochValue,
  });
  // const daoEpochValue = { length: 10, index: 5, number: 10478 }
  // const daoSince = SinceUtils.generateSince({
  //   relative: false,
  //   type: "epochNumber",
  //   value: daoEpochValue
  // })
  const multisigScript = secp256k1Blake160Multisig.serializeMultisigScript(
    bob.fromInfo
  );
  const args = secp256k1Blake160Multisig.multisigArgs(
    multisigScript,
    multisigSince
  );
  const depositCell: Cell = cloneObject(bobSecpDaoDepositInput);
  const withdrawCell: Cell = cloneObject(bobSecpDaoWithdrawInput);

  const multisigLock: Script = {
    codeHash:
      "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hashType: "type",
    args,
  };

  depositCell.cellOutput.lock = cloneObject(multisigLock);
  depositCell.blockHash = depositHeader.hash;
  withdrawCell.cellOutput.lock = cloneObject(multisigLock);
  withdrawCell.blockHash = withdrawHeader.hash;

  // number add 1
  const headerEpochValue = { length: 10, index: 5, number: 10479 };
  const epoch = SinceUtils.generateHeaderEpoch(headerEpochValue);
  tipHeader.epoch = epoch;

  const cellProvider = new CellProvider([withdrawCell]);
  const collector = new locktimePool.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const maximumWithdrawCapacity = calculateMaximumWithdrawCompatible(
    withdrawCell,
    depositHeader.dao,
    withdrawHeader.dao
  );

  const cells = await collectAllCells(collector);

  t.is(cells.length, 1);

  const cell = cells[0]! as LocktimeCell;

  t.is(cell.depositBlockHash, depositHeader.hash);
  t.is(cell.withdrawBlockHash, withdrawHeader.hash);
  t.is(cell.blockHash, withdrawHeader.hash);
  t.is(cell.blockNumber, withdrawHeader.number);
  t.is(
    BI.from(cell.cellOutput.capacity).toString(),
    maximumWithdrawCapacity.toString()
  );

  t.is(cell.since, multisigSince);
});

test("CellCollector, dao & multisig, multisig since type = blockNumber", async (t) => {
  const tipHeader = cloneObject(inputTipHeader);

  const epochValue = BI.from(1024);
  const multisigSince = SinceUtils.generateSince({
    relative: false,
    type: "blockNumber",
    value: BI.from(epochValue),
  });
  // const daoEpochValue = { length: 10, index: 5, number: 10478 }
  // const daoSince = SinceUtils.generateSince({
  //   relative: false,
  //   type: "epochNumber",
  //   value: daoEpochValue
  // })
  const multisigScript = secp256k1Blake160Multisig.serializeMultisigScript(
    bob.fromInfo
  );
  const args = secp256k1Blake160Multisig.multisigArgs(
    multisigScript,
    multisigSince
  );
  const depositCell: Cell = cloneObject(bobSecpDaoDepositInput);
  const withdrawCell: Cell = cloneObject(bobSecpDaoWithdrawInput);

  const multisigLock: Script = {
    codeHash:
      "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hashType: "type",
    args,
  };

  depositCell.cellOutput.lock = cloneObject(multisigLock);
  depositCell.blockHash = depositHeader.hash;
  withdrawCell.cellOutput.lock = cloneObject(multisigLock);
  withdrawCell.blockHash = withdrawHeader.hash;

  // number add 1
  const headerEpochValue = { length: 10, index: 5, number: 10479 };
  const epoch = SinceUtils.generateHeaderEpoch(headerEpochValue);
  tipHeader.epoch = epoch;

  const cellProvider = new CellProvider([withdrawCell]);
  const collector = new locktimePool.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    {
      config: AGGRON4,
      NodeRPC: RpcMocker as any,
      tipHeader,
    }
  );

  const cells = await collectAllCells(collector);

  // will skip
  t.is(cells.length, 0);
});
