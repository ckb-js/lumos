import { BI } from "@ckb-lumos/lumos";
import test from "ava";
import { deepHexifyBI, deepNumerifyBI } from "../src/utils";

test("test codec", (t) => {
  const tx = {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: BI.from("0x0"),
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: BI.from("0x10"),
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: BI.from("0x2"),
        },
      },
    ],
    outputs: [
      {
        capacity: BI.from("0x1234"),
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  };
  t.deepEqual(deepHexifyBI(tx), {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: "0x0",
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: "0x10",
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: "0x2",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x1234",
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  });

  t.deepEqual(deepNumerifyBI(tx), {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: "0",
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: "16",
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: "2",
        },
      },
    ],
    outputs: [
      {
        capacity: "4660",
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  });
});
