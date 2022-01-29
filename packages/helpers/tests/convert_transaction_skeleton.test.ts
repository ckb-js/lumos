import test from "ava";
import { List, Record, Map as ImmutableMap } from "immutable";
import {
  objectToTransactionSkeleton,
  transactionSkeletonToObject,
} from "../src";

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

  const keys = [
    "cellDeps",
    "headerDeps",
    "inputs",
    "outputs",
    "witnesses",
    "fixedEntries",
    "signingEntries",
  ];

  keys.forEach((key) => {
    t.true(txSkeleton.get(key as any) instanceof List);
    t.deepEqual(txSkeleton.get(key as any).toArray(), txSkeletonObject[key]);
  });

  t.deepEqual(
    txSkeleton.get("inputSinces").toJS(),
    txSkeletonObject["inputSinces"]
  );

  t.is(txSkeleton.get("inputSinces").get(0), txSkeletonObject.inputSinces["0"]);
});

test("transactionSkeletonToObject", (t) => {
  const txSkeletonObject = require("./fixtures/tx_skeleton.json");
  const txSkeleton = objectToTransactionSkeleton(txSkeletonObject);

  const obj = transactionSkeletonToObject(txSkeleton);

  const keys = [
    "cellDeps",
    "headerDeps",
    "inputs",
    "outputs",
    "witnesses",
    "fixedEntries",
    "signingEntries",
  ];

  keys.forEach((key) => {
    t.true((obj as any)[key] instanceof Array);
  });

  t.true(obj.inputSinces instanceof Object);
});
