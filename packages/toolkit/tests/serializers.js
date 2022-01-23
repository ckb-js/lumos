const test = require("ava");
const { normalizers, Reader } = require("../lib");
const CKB = require("../testfiles/blockchain.umd.js");

test("normalize and serialize script", (t) => {
  const value = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0xaabbccdd44332211",
    hash_type: "type",
  };
  const normalizedValue = normalizers.NormalizeScript(value);
  const serializedValue = CKB.SerializeScript(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x3d0000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80108000000aabbccdd44332211"
  );
});

test("normalize and serialize script with integer hash type", (t) => {
  const value = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0xaabbccdd44332211",
    hash_type: 1,
  };
  const normalizedValue = normalizers.NormalizeScript(value);
  const serializedValue = CKB.SerializeScript(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x3d0000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80108000000aabbccdd44332211"
  );
});

test("normalize invalid script", (t) => {
  const value = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0xaabbccdd4433221",
    hash_type: "type",
  };
  t.throws(() => {
    normalizers.NormalizeScript(value);
  });
});

test("normalize invalid script type", (t) => {
  const value = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0xaabbccdd44332211",
    hash_type: "invalidtype",
  };
  t.throws(() => {
    normalizers.NormalizeScript(value);
  });
});

test("normalize and serialize outpoint", (t) => {
  const value = {
    tx_hash:
      "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc",
    index: 3,
  };
  const normalizedValue = normalizers.NormalizeOutPoint(value);
  const serializedValue = CKB.SerializeOutPoint(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc03000000"
  );
});

test("normalize and serialize outpoint with hex number", (t) => {
  const value = {
    tx_hash:
      "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc",
    index: "0x3",
  };
  const normalizedValue = normalizers.NormalizeOutPoint(value);
  const serializedValue = CKB.SerializeOutPoint(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc03000000"
  );
});

test("normalize invalid outpoint", (t) => {
  const value = {
    tx_hash:
      "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc",
    index: "0x123412341",
  };
  t.throws(() => {
    normalizers.NormalizeOutPoint(value);
  });
});

test("normalize and serialize cellinput", (t) => {
  const value = {
    since: "0x60a0001234",
    previous_output: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x10",
    },
  };
  const normalizedValue = normalizers.NormalizeCellInput(value);
  const serializedValue = CKB.SerializeCellInput(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x341200a060000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da10000000"
  );
});

test("normalize invalid cellinput", (t) => {
  const value = {
    since: "0x60a0001234",
    previous_output: "hahah",
  };
  t.throws(() => {
    normalizers.NormalizeCellInput(value);
  });
});

test("normalize and serialize celloutput", (t) => {
  const value = {
    capacity: "0x10",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
    type: {
      code_hash:
        "0xa98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db",
      args: "0x",
      hash_type: "type",
    },
  };
  const normalizedValue = normalizers.NormalizeCellOutput(value);
  const serializedValue = CKB.SerializeCellOutput(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x8400000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da0002000000123435000000100000003000000031000000a98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db0100000000"
  );
});

test("normalize and serialize celloutput without type", (t) => {
  const value = {
    capacity: "0x10",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
  };
  const normalizedValue = normalizers.NormalizeCellOutput(value);
  const serializedValue = CKB.SerializeCellOutput(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x4f00000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da00020000001234"
  );
});

test("normalize invalid celloutput", (t) => {
  const value = {
    capacity: "0x102030405060708090",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
  };
  t.throws(() => {
    normalizers.NormalizeCellOutput(value);
  });
});

test("normalize and serialize celldep", (t) => {
  const value = {
    dep_type: "code",
    out_point: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x11",
    },
  };
  const normalizedValue = normalizers.NormalizeCellDep(value);
  const serializedValue = CKB.SerializeCellDep(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da1100000000"
  );
});

test("normalize and serialize transaction", (t) => {
  const value = {
    version: "0x0",
    cell_deps: [
      {
        dep_type: "code",
        out_point: {
          tx_hash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: "0x0",
        },
      },
    ],
    header_deps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: "0x10",
        previous_output: {
          tx_hash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: "0x2",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x1234",
        lock: {
          code_hash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hash_type: "data",
        },
      },
    ],
    outputs_data: ["0xabcdef"],
    witnesses: ["0x31313131"],
  };
  const normalizedValue = normalizers.NormalizeTransaction(value);
  const serializedValue = CKB.SerializeTransaction(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x1f0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef10000000080000000400000031313131"
  );
});

test("normalize and serialize header", (t) => {
  const value = {
    compact_target: "0x1a2d3494",
    number: "0xfb1bc",
    parent_hash:
      "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
    nonce: "0x449b385049af131a0000001584a00100",
    timestamp: "0x170aba663c3",
    transactions_root:
      "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
    epoch: "0x7080612000287",
    dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
  };
  const normalizedValue = normalizers.NormalizeHeader(value);
  const serializedValue = CKB.SerializeHeader(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x0000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b44"
  );
});

test("normalize and serialize uncle block", (t) => {
  const value = {
    header: {
      compact_target: "0x1a2d3494",
      number: "0xfb1bc",
      parent_hash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: "0x170aba663c3",
      transactions_root:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    },
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  };
  const normalizedValue = normalizers.NormalizeUncleBlock(value);
  const serializedValue = CKB.SerializeUncleBlock(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0xf40000000c000000dc0000000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440200000012345678901234567890abcdeabcdeabcdeabcde"
  );
});

test("normalize and serialize block", (t) => {
  const value = {
    header: {
      compact_target: "0x1a2d3494",
      number: "0xfb1bc",
      parent_hash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: "0x170aba663c3",
      transactions_root:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    },
    transactions: [
      {
        version: "0x0",
        cell_deps: [
          {
            dep_type: "code",
            out_point: {
              tx_hash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
              index: "0x0",
            },
          },
        ],
        header_deps: [
          "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
        ],
        inputs: [
          {
            since: "0x10",
            previous_output: {
              tx_hash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
              index: "0x2",
            },
          },
        ],
        outputs: [
          {
            capacity: "0x1234",
            lock: {
              code_hash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
              args: "0x1234",
              hash_type: "data",
            },
          },
        ],
        outputs_data: ["0xabcdef"],
        witnesses: ["0x1111"],
      },
    ],
    uncles: [],
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  };
  const normalizedValue = normalizers.NormalizeBlock(value);
  const serializedValue = CKB.SerializeBlock(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x2502000014000000e4000000e80000000d0200000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440400000025010000080000001d0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef0e000000080000000200000011110200000012345678901234567890abcdeabcdeabcdeabcde"
  );
});

test("normalize and serialize cellbase witness", (t) => {
  const value = {
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
    message: "0x1234abcdef",
  };
  const normalizedValue = normalizers.NormalizeCellbaseWitness(value);
  const serializedValue = CKB.SerializeCellbaseWitness(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x4c0000000c0000004300000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da00020000001234050000001234abcdef"
  );
});

test("normalize and serialize witness args", (t) => {
  const value = {
    lock: "0x1234",
    input_type: "0x4678",
    output_type: "0x2312",
  };
  const normalizedValue = normalizers.NormalizeWitnessArgs(value);
  const serializedValue = CKB.SerializeWitnessArgs(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(
    serializedHex,
    "0x2200000010000000160000001c000000020000001234020000004678020000002312"
  );
});

test("normalize and serialize empty witness args", (t) => {
  const value = {};
  const normalizedValue = normalizers.NormalizeWitnessArgs(value);
  const serializedValue = CKB.SerializeWitnessArgs(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(serializedHex, "0x10000000100000001000000010000000");
});

test("normalize and serialize only one witness args", (t) => {
  const value = {
    lock: "0x1234",
  };
  const normalizedValue = normalizers.NormalizeWitnessArgs(value);
  const serializedValue = CKB.SerializeWitnessArgs(normalizedValue);
  const serializedHex = new Reader(serializedValue).serializeJson();
  t.deepEqual(serializedHex, "0x16000000100000001600000016000000020000001234");
});
