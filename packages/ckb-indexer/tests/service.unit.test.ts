import test from "ava";
import { SearchKey } from "../src/type";
import { generateSearchKey } from "../src/services";

test("should generateSearchKey works fine", async (t) => {
  const expected: SearchKey = {
    script: {
      codeHash:
        "0x123456789012345678901234567890123456789001234567890012345678901234",
      hashType: "data",
      args: "0x1234567890123456789012345678901234567890",
    },
    scriptType: "lock",
    filter: {
      script: undefined,
      outputCapacityRange: undefined,
      blockRange: undefined,
      scriptLenRange: undefined,
      outputDataLenRange: ["0x1", "0x2"],
    },
  };
  t.deepEqual(
    generateSearchKey({
      lock: {
        codeHash:
          "0x123456789012345678901234567890123456789001234567890012345678901234",
        hashType: "data",
        args: "0x1234567890123456789012345678901234567890",
      },
      outputDataLenRange: ["0x1", "0x2"],
    }),
    expected
  );
});
