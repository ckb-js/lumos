import test from "ava";
import { createJoyIDScriptInfo } from "../src";
import {
  Connection,
  JoyIDCellCollector,
  JoyIDScriptInfoConfig,
} from "../src/script-info";
import { BytesLike, bytes } from "@ckb-lumos/codec";
import { randomBytes } from "node:crypto";
import { encodeToAddress, TransactionSkeleton } from "@ckb-lumos/helpers";
import {
  Cell,
  CellDep,
  CellProvider,
  OutPoint,
  QueryOptions,
  Script,
} from "@ckb-lumos/base";
import { common } from "@ckb-lumos/common-scripts";
import { parseUnit } from "@ckb-lumos/bi";
import { getJoyIDLockScript } from "@joyid/ckb";
import { getCotaTypeScript } from "../src/constants";
import { spy } from "sinon";

const joyIdLockScriptTemplate = getJoyIDLockScript(true);
const cotaTypeScriptTemplate = getCotaTypeScript(true);

const joyidCellDep: CellDep = {
  outPoint: mockOutPoint(),
  depType: "depGroup",
};

const config = {
  cellDeps: [joyidCellDep],
  joyIdLockScriptTemplate: joyIdLockScriptTemplate,
  cotaTypeScriptTemplate: cotaTypeScriptTemplate,
  aggregator: mockAggregator(),
};

const joyidLock = { ...joyIdLockScriptTemplate, args: "0x01" };
const address = encodeToAddress(joyidLock);
const cotaType = { ...cotaTypeScriptTemplate, args: "0x01" };

// a cota cell is required when the connection is in sub_key mode
const cotaCell: Cell = {
  cellOutput: { lock: joyidLock, type: cotaType, capacity: "0x0" },
  data: "0x",
  outPoint: mockOutPoint(),
};

test("setup JoyID cell with a main_key connection", async (t) => {
  const info = createJoyIDScriptInfo(
    { keyType: "main_key", address: address, pubkey: "" },
    config
  );

  const cotaCellProvider = mockCellProvider([cotaCell]);
  let txSkeleton = TransactionSkeleton({
    cellProvider: cotaCellProvider,
  });

  txSkeleton = await info.lockScriptInfo.setupInputCell(txSkeleton, {
    outPoint: mockOutPoint(),
    cellOutput: { capacity: "0x0", lock: joyidLock },
    data: "0x",
  });

  t.deepEqual(txSkeleton.get("cellDeps").toArray(), [joyidCellDep]);
  t.deepEqual(txSkeleton.get("inputs").size, 1);
  t.deepEqual(txSkeleton.get("outputs").size, 1);
});

test("setup JoyID cell with a sub_key connection", async (t) => {
  const info = createJoyIDScriptInfo(
    { keyType: "sub_key", address: address, pubkey: "" },
    config
  );

  const cotaCellProvider = mockCellProvider([cotaCell]);
  let txSkeleton = TransactionSkeleton({
    cellProvider: cotaCellProvider,
  });

  txSkeleton = await info.lockScriptInfo.setupInputCell(txSkeleton, {
    outPoint: mockOutPoint(),
    cellOutput: { capacity: "0x0", lock: joyidLock },
    data: "0x",
  });

  t.deepEqual(txSkeleton.get("cellDeps").toArray(), [
    { depType: "code", outPoint: cotaCell.outPoint },
    joyidCellDep,
  ]);
  t.deepEqual(txSkeleton.get("inputs").size, 1);
  t.deepEqual(txSkeleton.get("outputs").size, 1);
});

test("transfer via built-in JoyIDCellCollecot", async (t) => {
  const connection: Connection = {
    keyType: "main_key",
    address: address,
    pubkey: "",
  };

  const info = createJoyIDScriptInfo(connection, config);
  common.registerCustomLockScriptInfos([info]);

  const collectedCell: Cell = {
    cellOutput: {
      lock: joyidLock,
      capacity: parseUnit("10000", "ckb").toHexString(),
    },
    data: "0x",
    outPoint: mockOutPoint(),
  };

  const collect = (queryOptions: QueryOptions) => {
    t.is(queryOptions.type, "empty");
    return [collectedCell];
  };

  let txSkeleton = TransactionSkeleton({
    cellProvider: mockCellProvider(collect),
  });
  const toAddress = mockScript();

  const joyIdCollectSpy = spy(JoyIDCellCollector.prototype, "collect");

  txSkeleton = await common.transfer(
    txSkeleton,
    [address],
    encodeToAddress(toAddress),
    100 * 10 ** 8,
    undefined,
    undefined
  );

  t.deepEqual(txSkeleton.inputs.get(0), collectedCell);
  t.true(joyIdCollectSpy.called === true);
});

function mockAggregator(
  entry: BytesLike = randomBytes(32)
): JoyIDScriptInfoConfig["aggregator"] {
  return {
    generateSubkeyUnlockSmt: async () => ({
      unlock_entry: Buffer.from(bytes.bytify(entry)).toString("hex"),
      block_number: 0n,
    }),
  };
}

function mockOutPoint(): OutPoint {
  return {
    txHash: randomHex(32),
    index: randomHex(8),
  };
}

function mockCellProvider(
  cellsOrCollect: Cell[] | ((queryOptions: QueryOptions) => Cell[])
): CellProvider {
  return {
    collector: (queryOptions) => {
      const collected = Array.isArray(cellsOrCollect)
        ? cellsOrCollect
        : cellsOrCollect(queryOptions);

      let i = 0;
      return {
        collect: async function* () {
          while (i < cellsOrCollect.length) {
            yield collected[i++];
          }
        },
      };
    },
  };
}

function randomHex(byteLength: number) {
  return bytes.hexify(randomBytes(byteLength));
}

function mockScript(): Script {
  return {
    codeHash: randomHex(32),
    hashType: "type",
    args: randomHex(20),
  };
}
