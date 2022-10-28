import test from "ava";

import { isScriptWrapper, isCellMatchQueryOptions } from "../src/helpers";
import type { Script, Cell } from "../src/api";

test("isScriptWrapper", (t) => {
  const dummyScript: Script = {
    codeHash: "0x KFC Crazy Thursday Give Me $50",
    hashType: "data1",
    args: "0x",
  };
  t.false(isScriptWrapper(null));

  t.false(isScriptWrapper(dummyScript));
  t.true(isScriptWrapper({ script: dummyScript }));
});

test("isCellMatchQueryOptions", (t) => {
  const scep256k1Lock: Script = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
    args: "0x",
  };
  const sudtType: Script = {
    codeHash:
      "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5",
    hashType: "type",
    args: "0x",
  };
  const cell: Cell = {
    cellOutput: {
      capacity: "0x1",
      lock: scep256k1Lock,
      type: sudtType,
    },
    data: "0x",
    outPoint: { txHash: "0xAE86", index: "0x0" },
    blockHash: "0x0",
    blockNumber: "0x114514",
  };

  t.true(isCellMatchQueryOptions(cell, {}));
});
