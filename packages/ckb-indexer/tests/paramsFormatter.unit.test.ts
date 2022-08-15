import test from "ava";
import { toSearchKey } from "../src/paramsFormatter";
import { SearchKey } from "../src/type";
import type * as RPCType from "../src/rpcType";

test("should toSearchKey works fine", async (t) => {
  const query: SearchKey = {
    script: {
      codeHash:
        "0x123456789012345678901234567890123456789001234567890012345678901234",
      hashType: "data",
      args: "0x1234567890123456789012345678901234567890",
    },
    scriptType: "lock",
    filter: {
      outputDataLenRange: ["0x1", "0x2"],
    },
  };
  const expected: RPCType.SearchKey = {
    script: {
      args: "0x1234567890123456789012345678901234567890",
      code_hash:
        "0x123456789012345678901234567890123456789001234567890012345678901234",
      hash_type: "data",
    },
    script_type: "lock",
    filter: {
      script: undefined,
      block_range: undefined,
      output_capacity_range: undefined,
      output_data_len_range: ["0x1", "0x2"],
    },
  };

  t.deepEqual(toSearchKey(query), expected);
});
