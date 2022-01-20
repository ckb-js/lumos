const test = require("ava");
const { transformers, Reader } = require("../lib");

test("transform script", (t) => {
  const s = transformers.TransformScript({
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: Reader.fromRawString("args1234"),
    hash_type: {
      serializeJson: () => "data",
    },
  });

  t.deepEqual(s, {
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x6172677331323334",
    hash_type: "data",
  });
});

test("transform camel case script", (t) => {
  const s = transformers.TransformScript({
    codeHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: Reader.fromRawString("args1234"),
    hashType: {
      serializeJson: () => "data",
    },
  });

  t.deepEqual(s, {
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x6172677331323334",
    hash_type: "data",
  });
});

test("transform plain script", (t) => {
  const s = transformers.TransformScript({
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x1234",
    hash_type: "data",
  });

  t.deepEqual(s, {
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x1234",
    hash_type: "data",
  });
});

test("transform invalid script", (t) => {
  t.throws(() => {
    transformers.TransformScript({
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0xgghh",
      hash_type: "data",
    });
  });
});

test("transform invalid script but do not validate", (t) => {
  const s = transformers.TransformScript(
    {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0xgghh",
      hash_type: "data",
    },
    { validation: false }
  );

  t.deepEqual(s, {
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0xgghh",
    hash_type: "data",
  });
});

test("transform outpoint", (t) => {
  const o = transformers.TransformOutPoint({
    tx_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x0",
  });

  t.deepEqual(o, {
    tx_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x0",
  });
});

test("transform outpoint more fields", (t) => {
  const o = transformers.TransformOutPoint({
    tx_hash: {
      serializeJson: () =>
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      anotherfield: "not used",
    },
    index: "0x10",
    unneeded: "unneeded field",
  });

  t.deepEqual(o, {
    tx_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x10",
  });
});

test("correct cellinput", (t) => {
  const v = transformers.TransformCellInput({
    since: "0x0",
    previous_output: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: new Reader("0x10"),
    },
  });

  t.deepEqual(v, {
    since: "0x0",
    previous_output: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x10",
    },
  });
});

test("correct cellinput with serialize function using this", (t) => {
  const v = transformers.TransformCellInput({
    since: "0x0",
    previous_output: {
      value: {
        tx_hash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        index: "0x10",
      },
      serializeJson: function () {
        return this.value;
      },
    },
  });

  t.deepEqual(v, {
    since: "0x0",
    previous_output: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x10",
    },
  });
});

test("invalid cellinput", (t) => {
  t.throws(() => {
    transformers.TransformCellInput({
      since: "0x0",
      previous_output: {
        tx_hash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        index: new Reader("0x00"),
      },
    });
  });
});

test("celloutput with type", (t) => {
  const v = transformers.TransformCellOutput({
    capacity: "0x10",
    lock: {
      value: {
        code_hash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: new Reader("0x1234"),
        hash_type: "data",
      },
      serializeJson: function () {
        return this.value;
      },
    },
    type: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hash_type: "type",
    },
  });

  t.deepEqual(v, {
    capacity: "0x10",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
    type: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hash_type: "type",
    },
  });
});

test("celloutput", (t) => {
  const v = transformers.TransformCellOutput({
    capacity: "0x1024",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hash_type: "type",
    },
  });

  t.deepEqual(v, {
    capacity: "0x1024",
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hash_type: "type",
    },
  });
});

test("celloutput invalid lock but skip validation", (t) => {
  const v = transformers.TransformCellOutput(
    {
      capacity: "0x1024",
      type: {
        code_hash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: "0x",
        hash_type: "type",
      },
      unused: "value",
    },
    { validation: false }
  );

  t.deepEqual(v, {
    capacity: "0x1024",
    type: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hash_type: "type",
    },
  });
});

test("celloutput invalid lock", (t) => {
  t.throws(() => {
    transformers.TransformCellOutput({
      capacity: "0x1024",
      type: {
        code_hash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: "0x",
        hash_type: "type",
      },
    });
  });
});

test("correct celldep", (t) => {
  const v = transformers.TransformCellDep({
    dep_type: {
      serializeJson: () => {
        return "code";
      },
    },
    out_point: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x0",
    },
  });

  t.deepEqual(v, {
    dep_type: "code",
    out_point: {
      tx_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x0",
    },
  });
});

class DummyValueHolder {
  constructor(value) {
    this.value = value;
  }

  serializeJson() {
    return this.value;
  }
}

test("correct transaction", (t) => {
  const v = transformers.TransformTransaction({
    version: "0x0",
    cell_deps: [
      {
        dep_type: "code",
        out_point: {
          tx_hash: {
            value: "0xa98c57135830e1b91345948df6c4b887082819",
            serializeJson: function () {
              return this.value + "9a786b26f09f7dec4bc27a7300";
            },
          },
          index: "0x0",
        },
        redundant_key: "unused value",
      },
    ],
    header_deps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: new DummyValueHolder("0x10"),
        previous_output: {
          tx_hash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: {
            serializeJson: () => {
              return "0x2";
            },
          },
        },
      },
    ],
    outputs: [
      {
        capacity: "0x1234",
        lock: {
          code_hash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: new Reader("0x1234"),
          hash_type: "data",
        },
      },
    ],
    outputs_data: ["0xabcdef"],
    witnesses: [Reader.fromRawString("1111")],
  });

  t.deepEqual(v, {
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
  });
});

test("correct header", (t) => {
  const v = transformers.TransformHeader({
    compact_target: "0x1a2d3494",
    number: "0xfb1bc",
    parent_hash:
      "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
    nonce: "0x449b385049af131a0000001584a00100",
    timestamp: "0x170aba663c3",
    transactions_root: new Reader(
      "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a"
    ),
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
    epoch: "0x7080612000287",
    dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
  });

  t.deepEqual(v, {
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
  });
});

test("invalid header", (t) => {
  t.throws(() => {
    transformers.TransformHeader({
      compact_target: "0x1a2d3494",
      number: "0xfb1bc",
      parent_hash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: new Reader("0x170aba663c3"),
      transactions_root:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287a",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    });
  });
});

test("correct block", (t) => {
  const v = transformers.TransformBlock({
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
              tx_hash: new Reader(
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300"
              ),
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
              hash_type: {
                serializeJson: () => {
                  return "data";
                },
              },
            },
          },
        ],
        outputs_data: ["0xabcdef"],
        witnesses: ["0x1111"],
      },
    ],
    uncles: [],
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  });

  t.deepEqual(v, {
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
  });
});

test("correct cellbase witness", (t) => {
  const v = transformers.TransformCellbaseWitness({
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
      unneeded1: "unneeded1",
    },
    message: "0x1234abcdef",
    unneeded2: 2,
  });

  t.deepEqual(v, {
    lock: {
      code_hash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hash_type: "data",
    },
    message: "0x1234abcdef",
  });
});

test("correct witness args", (t) => {
  const v = transformers.TransformWitnessArgs({
    lock: "0x1234",
    input_type: "0x4678",
    output_type: "0x2312",
  });

  t.deepEqual(v, {
    lock: "0x1234",
    input_type: "0x4678",
    output_type: "0x2312",
  });
});

test("empty witness args", (t) => {
  const v = transformers.TransformWitnessArgs({});

  t.deepEqual(v, {});
});

test("only one witness args", (t) => {
  const v = transformers.TransformWitnessArgs({
    lock: "0x1234",
    unneeded: "unneeded123",
  });

  t.deepEqual(v, {
    lock: "0x1234",
  });
});
