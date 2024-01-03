import test, { afterEach, beforeEach } from "ava";
import { registerCustomLockScriptInfos } from "../src/common";
import { TestCellCollector } from "./helper";
import {
  encodeToAddress,
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { Cell, Script } from "@ckb-lumos/base";
import { BI, parseUnit } from "@ckb-lumos/bi";
import { CellProvider } from "./cell_provider";
import { dao } from "../src";
import { Config, predefined } from "@ckb-lumos/config-manager";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { Uint64 } from "@ckb-lumos/codec/lib/number";
import { randomBytes } from "node:crypto";

const { LINA } = predefined;

const nonSystemLockCodeHash = "0x" + "aa".repeat(32);

beforeEach(() => {
  registerCustomLockScriptInfos([
    {
      codeHash: nonSystemLockCodeHash,
      hashType: "type",
      lockScriptInfo: {
        CellCollector: TestCellCollector,
        async setupInputCell(
          txSkeleton: TransactionSkeletonType,
          inputCell: Cell
        ): Promise<TransactionSkeletonType> {
          txSkeleton = txSkeleton.update("inputs", (inputs) =>
            inputs.push(inputCell)
          );

          txSkeleton = txSkeleton.update("outputs", (outputs) =>
            outputs.push(inputCell)
          );

          return txSkeleton;
        },
        prepareSigningEntries(txSkeleton) {
          return txSkeleton;
        },
      },
    },
  ]);
});

// reset custom lock script infos
afterEach(() => {
  registerCustomLockScriptInfos([]);
});

test("deposit from the non-system script", async (t) => {
  const fromScript: Script = {
    codeHash: nonSystemLockCodeHash,
    hashType: "type",
    args: "0x",
  };

  const toScript: Script = {
    codeHash: "0x" + "bb".repeat(32),
    hashType: "type",
    args: "0x",
  };
  const nonSystemLockCell = {
    cellOutput: {
      capacity: parseUnit("5000000", "ckb").toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };
  let txSkeleton = TransactionSkeleton({
    cellProvider: new CellProvider([nonSystemLockCell]),
  });

  txSkeleton = await dao.deposit(
    txSkeleton,
    encodeToAddress(fromScript),
    encodeToAddress(toScript),
    parseUnit("10000", "ckb"),
    { enableNonSystemScript: true }
  );

  t.deepEqual(txSkeleton.get("inputs").get(0), nonSystemLockCell);
  t.is(txSkeleton.get("outputs").size, 2);
  t.deepEqual(txSkeleton.get("outputs").get(0)?.cellOutput, {
    capacity: parseUnit("10000", "ckb").toHexString(),
    lock: toScript,
    type: generateDaoTypeScript(LINA),
  });
  t.deepEqual(txSkeleton.get("outputs").get(1)?.cellOutput, {
    capacity: BI.from(nonSystemLockCell.cellOutput.capacity)
      .sub(parseUnit("10000", "ckb"))
      .toHexString(),
    lock: fromScript,
    type: undefined,
  });
});

test("withdraw with registered lock script", async (t) => {
  const fromScript: Script = {
    codeHash: nonSystemLockCodeHash,
    hashType: "type",
    args: "0x",
  };

  const nonSystemLockCell: Cell = {
    cellOutput: {
      capacity: parseUnit("5000000", "ckb").toHexString(),
      lock: fromScript,
      type: generateDaoTypeScript(LINA),
    },
    data: hexify(Uint64.pack(0)),
    blockHash: hexify(randomBytes(32)),
    blockNumber: "0x123456",
    outPoint: { txHash: hexify(randomBytes(32)), index: "0x0" },
  };
  let txSkeleton = TransactionSkeleton({
    cellProvider: new CellProvider([nonSystemLockCell]),
  });

  txSkeleton = await dao.withdraw(txSkeleton, nonSystemLockCell, undefined, {
    enableNonSystemScript: true,
  });

  t.deepEqual(txSkeleton.inputs.get(-1), nonSystemLockCell);
  t.deepEqual(txSkeleton.outputs.get(-1), {
    ...nonSystemLockCell,
    data: hexify(Uint64.pack(0x123456)),
  });
});

const generateDaoTypeScript = (config: Config): Script => {
  return {
    codeHash: config.SCRIPTS.DAO!.CODE_HASH,
    hashType: config.SCRIPTS.DAO!.HASH_TYPE,
    args: "0x",
  };
};
