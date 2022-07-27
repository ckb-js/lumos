import test from "ava";
import { List, Record, Map as ImmutableMap } from "immutable";
import { createTransactionFromSkeleton, objectToTransactionSkeleton, transactionSkeletonToObject } from "../src";
import { TransactionSkeleton } from "../lib";
import { Cell } from "@ckb-lumos/base";

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("objectToTransactionSkeleton", (t) => {
  const txSkeletonObject = require("./fixtures/tx_skeleton.json");
  const txSkeleton = objectToTransactionSkeleton(txSkeletonObject);

  t.true(txSkeleton instanceof Record);
  t.true(txSkeleton.get("inputSinces") instanceof ImmutableMap);

  const keys = ["cellDeps", "headerDeps", "inputs", "outputs", "witnesses", "fixedEntries", "signingEntries"];

  keys.forEach((key) => {
    t.true(txSkeleton.get(key as any) instanceof List);
    t.deepEqual(txSkeleton.get(key as any).toArray(), txSkeletonObject[key]);
  });

  t.deepEqual(txSkeleton.get("inputSinces").toJS(), txSkeletonObject["inputSinces"]);

  t.is(txSkeleton.get("inputSinces").get(0), txSkeletonObject.inputSinces["0"]);
});

test("transactionSkeletonToObject", (t) => {
  const txSkeletonObject = require("./fixtures/tx_skeleton.json");
  const txSkeleton = objectToTransactionSkeleton(txSkeletonObject);

  const obj = transactionSkeletonToObject(txSkeleton);

  const keys = ["cellDeps", "headerDeps", "inputs", "outputs", "witnesses", "fixedEntries", "signingEntries"];

  keys.forEach((key) => {
    t.true((obj as any)[key] instanceof Array);
  });

  t.true(obj.inputSinces instanceof Object);
});

test("createTransactionFromSkeleton, invalid input", (t) => {
  let txSkeleton = new TransactionSkeleton();
  const inputCell: Cell = {
    cellOutput: {
      capacity: "0x0",
      lock: {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        args: "0x159890a7cacb44a95bef0743064433d763de229c",
        hashType: "type",
      },
    },
    data: "0x0",
  };
  txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(inputCell));
  const error = t.throws(() => createTransactionFromSkeleton(txSkeleton));
  t.is(error.message, "cannot find OutPoint in Inputs[0] when createTransactionFromSkeleton");
});
