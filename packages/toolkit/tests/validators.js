const test = require("ava");
const { validators } = require("../lib");

test("correct script should pass validation", (t) => {
  validators.ValidateScript({
    codeHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x1234",
    hashType: "data",
  });
  t.pass();
});

test("concorect ckb2021 script should pass validation", (t) => {
  validators.ValidateScript({
    codeHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x1234",
    hashType: "data1",
  });

  t.pass();
});

test("correct script with empty args", (t) => {
  validators.ValidateScript({
    codeHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x",
    hashType: "type",
  });
  t.pass();
});

test("script that is not object", (t) => {
  t.throws(() => {
    validators.ValidateScript("i am a script, trust me");
  });
});

test("script with invalid code hash", (t) => {
  t.throws(() => {
    validators.ValidateScript({
      codeHash: "0xa98c57135830e1b913",
      args: "0x",
      hashType: "type",
    });
  });
});

test("script with invalid args", (t) => {
  t.throws(() => {
    validators.ValidateScript({
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0xthisisnothex",
      hashType: "type",
    });
  });
});

test("script with invalid hash type", (t) => {
  t.throws(() => {
    validators.ValidateScript({
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hashType: "code",
    });
  });
});

test("correct outpoint", (t) => {
  validators.ValidateOutPoint({
    txHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x0",
  });
  t.pass();
});

test("correct outpoint with positive number", (t) => {
  validators.ValidateOutPoint({
    txHash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x101",
  });
  t.pass();
});

test("outpoint with zero leaded invalid number", (t) => {
  t.throws(() => {
    validators.ValidateOutPoint({
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x010",
    });
  });
});

test("outpoint with invalid hex number", (t) => {
  t.throws(() => {
    validators.ValidateOutPoint({
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0xgg1",
    });
  });
});

test("correct cellinput", (t) => {
  validators.ValidateCellInput({
    since: "0x10",
    previousOutput: {
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x0",
    },
  });
  t.pass();
});

test("cellinput with invalid since", (t) => {
  t.throws(() => {
    validators.ValidateCellInput({
      since: "0x0001",
      previousOutput: {
        txHash: "0xa98c57135830e1b91345948df",
        index: "0x0",
      },
    });
  });
});

test("cellinput with invalid outpoint", (t) => {
  t.throws(() => {
    validators.ValidateCellInput({
      since: "0x0",
      previousOutput: {
        txHash: "0xa98c57135830e1b91345948df",
        index: "0x0",
      },
    });
  });
});

test("cellinput with invalid outpoint but skip nested validation", (t) => {
  validators.ValidateCellInput(
    {
      since: "0x0",
      previousOutput: {
        txHash: "0xa98c57135830e1b91345948df",
        index: "0x0",
      },
    },
    { nestedValidation: false }
  );
  t.pass();
});

test("correct celloutput", (t) => {
  validators.ValidateCellOutput({
    capacity: "0x10",
    lock: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hashType: "data",
    },
  });
  t.pass();
});

test("correct celloutput with type", (t) => {
  validators.ValidateCellOutput({
    capacity: "0x10",
    lock: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hashType: "data",
    },
    type: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x",
      hashType: "type",
    },
  });
  t.pass();
});

test("celloutput with invalid capacity", (t) => {
  t.throws(() => {
    validators.ValidateCellOutput({
      capacity: "0xggg",
      lock: {
        codeHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: "0x1234",
        hashType: "data",
      },
    });
  });
});

test("celloutput with invalid lock", (t) => {
  t.throws(() => {
    validators.ValidateCellOutput({
      capacity: "0x10",
      lock: {
        invalid: "lock",
      },
    });
  });
});

test("celloutput with invalid lock but skips validation", (t) => {
  validators.ValidateCellOutput(
    {
      capacity: "0x10",
      lock: {
        invalid: "lock",
      },
    },
    { nestedValidation: false }
  );
  t.pass();
});

test("correct celldep", (t) => {
  validators.ValidateCellDep({
    depType: "code",
    outPoint: {
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: "0x0",
    },
  });
  t.pass();
});

test("celldep with invalid dep type", (t) => {
  t.throws(() => {
    validators.ValidateCellDep({
      depType: "data",
      outPoint: {
        txHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        index: "0x0",
      },
    });
  });
});

test("celldep with invalid out point", (t) => {
  t.throws(() => {
    validators.ValidateCellDep({
      depType: "depGroup",
      outPoint: "invalid out point",
    });
  });
});

test("celldep with invalid out point but skips validation", (t) => {
  validators.ValidateCellDep(
    {
      depType: "depGroup",
      outPoint: "invalid out point",
    },
    { nestedValidation: false }
  );
  t.pass();
});

test("correct raw transaction", (t) => {
  validators.ValidateRawTransaction({
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
  });
  t.pass();
});

test("invalid raw transaction", (t) => {
  t.throws(() => {
    validators.ValidateRawTransaction({
      version: "0x0",
      cellDeps: "invalid",
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
    });
  });
});

test("correct transaction", (t) => {
  validators.ValidateTransaction({
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
    witnesses: ["0x1111"],
  });
  t.pass();
});

test("correct header", (t) => {
  validators.ValidateHeader({
    compactTarget: "0x1a2d3494",
    number: "0xfb1bc",
    parentHash:
      "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
    nonce: "0x449b385049af131a0000001584a00100",
    timestamp: "0x170aba663c3",
    transactionsRoot:
      "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
    proposalsHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    extraHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
    epoch: "0x7080612000287",
    dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
  });
  t.pass();
});

test("invalid header", (t) => {
  t.throws(() => {
    validators.ValidateHeader({
      compactTarget: "0x1a2d3494",
      number: "0xfb1bc",
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a0",
      timestamp: "0x170aba663c3",
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    });
  });
});

test("invalid raw header", (t) => {
  t.throws(() => {
    validators.ValidateRawHeader({
      compactTarget: "0x1a2d3494",
      number: "0xfb1bc",
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: "0x170aba663c3",
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    });
  });
});

test("validate uncle block", (t) => {
  validators.ValidateUncleBlock({
    header: {
      compactTarget: "0x1a2d3494",
      number: "0xfb1bc",
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: "0x170aba663c3",
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    },
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  });
  t.pass();
});

test("validate invalid uncle block", (t) => {
  t.throws(() => {
    validators.ValidateUncleBlock({
      header: {
        compactTarget: "0x1a2d3494",
        number: "0xfb1bc",
        parentHash:
          "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
        nonce: "0x449b385049af131a0000001584a00100",
        timestamp: "0x170aba663c3",
        transactionsRoot:
          "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
        proposalsHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        extraHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        version: "0x0",
        epoch: "0x7080612000287",
        dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
      },
      proposals: ["0x12345678901234567890", "0xabcdeabcdeab"],
    });
  });
});

test("validate invalid uncle block but skips nested validation", (t) => {
  validators.ValidateUncleBlock(
    {
      header: 123123,
      proposals: ["0x12345678901234567890"],
    },
    { nestedValidation: false }
  );
  t.pass();
});

test("validate block", (t) => {
  validators.ValidateBlock({
    header: {
      compactTarget: "0x1a2d3494",
      number: "0xfb1bc",
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: "0x449b385049af131a0000001584a00100",
      timestamp: "0x170aba663c3",
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
      epoch: "0x7080612000287",
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    },
    transactions: [
      {
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
        witnesses: ["0x1111"],
      },
    ],
    uncles: [],
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  });
  t.pass();
});

test("correct cellbase witness", (t) => {
  validators.ValidateCellbaseWitness({
    lock: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hashType: "data",
    },
    message: "0x1234abcdef",
  });
  t.pass();
});

test("correct witness args", (t) => {
  validators.ValidateWitnessArgs({
    lock: "0x1234",
    inputType: "0x4678",
    outputType: "0x2312",
  });
  t.pass();
});

test("empty witness args", (t) => {
  validators.ValidateWitnessArgs({});
  t.pass();
});

test("only one witness args", (t) => {
  validators.ValidateWitnessArgs({
    lock: "0x1234",
  });
  t.pass();
});

test("invalid witness args", (t) => {
  t.throws(() => {
    validators.ValidateWitnessArgs({
      lock: "0x1234",
      invalidkey: "0x1232",
    });
  });
});

test("invalid witness args content", (t) => {
  t.throws(() => {
    validators.ValidateWitnessArgs({
      lock: "0x1234gg",
    });
  });
});
