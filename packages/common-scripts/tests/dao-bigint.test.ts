import test from "ava";
import { dao } from "../src";
import { Cell } from "@ckb-lumos/base";

const calculateMaximumWithdrawInfo = {
  depositInput: {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: {
        code_hash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hash_type: "type",
        args: "0x",
      },
    },
    out_point: {
      tx_hash:
        "0x9fbcf16a96897c1b0b80d4070752b9f30577d91275f5b460b048b955b58e08eb",
      index: "0x0",
    },
    block_hash:
      "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    block_number: "0x19249",
    data: "0x0000000000000000",
  },
  depositHeader: {
    compact_target: "0x20010000",
    dao: "0x8eedf002d7c88852433518952edc28002dd416364532c50800d096d05aac0200",
    epoch: "0xa000500283a",
    hash: "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    nonce: "0x98e10e0a992f7274c7dc0c62e9d42f02",
    number: "0x19249",
    parent_hash:
      "0xd4f3e8725de77aedadcf15755c0f6cdd00bc8d4a971e251385b59ce8215a5d70",
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "0x17293289266",
    transactions_root:
      "0x9294a800ec389d1b0d9e7c570c249da260a44cc2790bd4aa250f3d5c83eb8cde",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
  },
  withdrawHeader: {
    compact_target: "0x20010000",
    dao: "0x39d32247d33f90523d37dae613dd280037e9cc1d7b01c708003d8849d8ac0200",
    epoch: "0xa0008002842",
    hash: "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
    nonce: "0x7ffb49f45f12f2b30ac45586ecf13de2",
    number: "0x1929c",
    parent_hash:
      "0xfe601308a34f1faf68906d2338e60246674ed1f1fbbad3d8471daca21a11cdf7",
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "0x1729cdd69c9",
    transactions_root:
      "0x467d72af12af6cb122985f9838bfc47073bba30cc37a4075aef54b0f0768f384",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
  },
  expectedWithdrawCapacity: BigInt("0x1748ec3fdc"),
};

test("BigInt:calculateMaximumWithdraw", (t) => {
  const {
    depositInput,
    depositHeader,
    withdrawHeader,
    expectedWithdrawCapacity,
  } = calculateMaximumWithdrawInfo;
  const result = dao.calculateMaximumWithdraw(
    depositInput as Cell,
    depositHeader.dao,
    withdrawHeader.dao
  );

  t.is(result, expectedWithdrawCapacity);
});

test("BigInt:calculateDaoEarliestSince", (t) => {
  const { depositHeader, withdrawHeader } = calculateMaximumWithdrawInfo;

  const result = dao.calculateDaoEarliestSince(
    depositHeader.epoch,
    withdrawHeader.epoch
  );

  // since: relative = false, type = epochNumber value = { length: 10, index: 5, number: 10478 }
  // if decrease index to 4, will false to validation by dao script
  t.is(result, BigInt("0x20000a00050028ee"));
});
