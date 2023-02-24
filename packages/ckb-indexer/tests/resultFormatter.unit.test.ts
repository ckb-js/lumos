import test from "ava";
import { toSearchKey, toTransactionRPCResult } from "../src/resultFormatter";
import { SearchKey } from "../src/type";
import type * as RPCType from "../src/rpcType";
import { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";
import TransactionStatus = CKBComponents.TransactionStatus;
import { GetTransactionRPCResult } from "../lib/type";

test("should toSearchKey works fine", async (t) => {
  const query: RPCType.SearchKey = {
    script: {
      args: "0x1234567890123456789012345678901234567890",
      code_hash:
        "0x123456789012345678901234567890123456789001234567890012345678901234",
      hash_type: "data",
    },
    script_type: "lock",
    filter: {
      output_data_len_range: ["0x1", "0x2"],
    },
  };
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
      scriptLenRange: undefined,
      blockRange: undefined,
      outputDataLenRange: ["0x1", "0x2"],
    },
  };
  t.deepEqual(toSearchKey(query), expected);
});

test("should toTransactionRPCResult works fine", async (t) => {
  const query: RPCType.GetTransactionRPCResult = {
    jsonrpc: "2.0",
    id: 0,
    result: {
      transaction: {
        version: "0x0",
        cell_deps: [
          {
            dep_type: "depGroup" as never,
            out_point: {
              index: "0x0",
              tx_hash:
                "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            },
          },
        ],
        header_deps: [],
        inputs: [
          {
            previous_output: {
              index: "0x1",
              tx_hash:
                "0x2acc28e6df5346ae0dd9b9c7ede149530ba40dd97025713bcdeb32421cff9bef",
            },
            since: "",
          },
        ],
        outputs: [
          {
            capacity: "0xe8d4a51000",
            lock: {
              code_hash:
                "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
              hash_type: "type",
              args: "0x019ac7acae3177a84e9d1957504ad7d01bcb68e71500",
            },
            type: undefined,
          },
        ],
        witnesses: [
          "0x5500000010000000550000005500000041000000bf7ae4205c3ab35d3bf45375fd89991fd1ed0fc282b7fbebf03b26739fda490d330060e9a6e0530439a876936d177ed64ad3b28c09a90c492e93498a391c418c00",
        ],
        outputs_data: ["0x", "0x"],
        hash: "0x3d34ad3e994c4b1d21bbd4e335348e458dc4703723bbd9a6c1e21d3c9f0c4bb2",
      },
      tx_status: {
        status: "committed" as never,
        block_hash: "",
      },
    },
  };
  const expected: GetTransactionRPCResult = {
    jsonrpc: "2.0",
    id: 0,
    result: {
      transaction: {
        version: "0x0",
        cellDeps: [
          {
            depType: "depGroup" as never,
            outPoint: {
              index: "0x0",
              txHash:
                "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            },
          },
        ],
        headerDeps: [],
        inputs: [
          {
            previousOutput: {
              index: "0x1",
              txHash:
                "0x2acc28e6df5346ae0dd9b9c7ede149530ba40dd97025713bcdeb32421cff9bef",
            },
            since: "",
          },
        ],
        outputs: [
          {
            capacity: "0xe8d4a51000",
            lock: {
              codeHash:
                "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
              hashType: "type",
              args: "0x019ac7acae3177a84e9d1957504ad7d01bcb68e71500",
            },
            type: undefined,
          },
        ],
        witnesses: [
          "0x5500000010000000550000005500000041000000bf7ae4205c3ab35d3bf45375fd89991fd1ed0fc282b7fbebf03b26739fda490d330060e9a6e0530439a876936d177ed64ad3b28c09a90c492e93498a391c418c00",
        ],
        outputsData: ["0x", "0x"],
        hash: "0x3d34ad3e994c4b1d21bbd4e335348e458dc4703723bbd9a6c1e21d3c9f0c4bb2",
      },
      txStatus: {
        status: TransactionStatus.Committed,
        blockHash: "",
      },
    },
  };
  t.deepEqual(toTransactionRPCResult(query), expected);
});
