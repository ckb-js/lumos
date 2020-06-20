const test = require("ava");
const { TransactionSkeleton } = require("@ckb-lumos/helpers");
const { locktimePool } = require("../lib");
const { transfer, prepareSigningEntries, payFee } = locktimePool;
const { CellProvider } = require("./cell_provider");
const { calculateMaximumWithdraw } = require("../lib/dao");
const { List } = require("immutable");

const inputInfos = [
  {
    cell: {
      // multisig
      cell_output: {
        capacity: "0x174876e800",
        lock: {
          code_hash:
            "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
          hash_type: "type",
          args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
        },
        type: undefined,
      },
      out_point: {
        tx_hash:
          "0xb4f92e2a74905ca2d24b952e782c42f35f18893cb56e46728857a926a893f41f",
        index: "0x0",
      },
      block_hash:
        "0x62e03ef430cb72041014224417de08caf73d4e804eaca7813c2015abcd6afe1a",
      block_number: "0x1aee1",
      data: "0x",
    },
    maximumCapacity: 100000000000n,
    since: 0n,
    depositBlockHash: undefined,
    withdrawBlockHash: undefined,
    header: {
      compact_target: "0x20010000",
      dao: "0x86b6bb6ef01f1b5501b60c23472a2900f30e9ff205c664090024c7b806d50200",
      epoch: "0xa0005002b16",
      hash:
        "0x62e03ef430cb72041014224417de08caf73d4e804eaca7813c2015abcd6afe1a",
      nonce: "0xe50676a79d7dc591d6d61f9d1b2d47ab",
      number: "0x1aee1",
      parent_hash:
        "0x75377290f1cedcbbeabeb19af3aac2afb94e362b5093fc6a7755361ebe21c0cc",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: "0x172b7721b70",
      transactions_root:
        "0x9b0396de353a052bb6b031b952a937a64de2511249211f82c827e59d9425ac14",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
    },
  },
  {
    cell: {
      // multisig
      cell_output: {
        capacity: "0x174876e800",
        lock: {
          code_hash:
            "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
          hash_type: "type",
          args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8152b00c000f00020",
        },
        type: undefined,
      },
      out_point: {
        tx_hash:
          "0x7d18dee8cf66bdc4721d18207dc18434f1d68af75537c89f97cb8618de73d871",
        index: "0x0",
      },
      block_hash:
        "0xee89cacb5ff0dd3edcca3904619693355396536cce45658bf9a9c676ae3819c3",
      block_number: "0x1aedd",
      data: "0x",
    },
    maximumCapacity: 100000000000n,
    since: 2306106895225596693n,
    depositBlockHash: undefined,
    withdrawBlockHash: undefined,
    header: {
      compact_target: "0x20010000",
      dao: "0x0ac112f0d7c31a55d77679563c2a2900f070432db3af6409000b276fffd40200",
      epoch: "0xa0001002b16",
      hash:
        "0xee89cacb5ff0dd3edcca3904619693355396536cce45658bf9a9c676ae3819c3",
      nonce: "0xf3f53c58e5f726c0db69736a4d0c1c57",
      number: "0x1aedd",
      parent_hash:
        "0xea7c5e8a592c48c372570b90f1bf806ffbb0152677abf4d080ffc127eb3efb88",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: "0x172b6608868",
      transactions_root:
        "0x70b51b289c66b5083827bcf9ab73b092f8aa1922d0421088c283a819567e6d4d",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
    },
  },
  {
    cell: {
      // default lock, dao
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
          "0x42300d78faea694e0e1c2316de091964a0d976a4ed27775597bad2d43a3e17da",
        index: "0x0",
      },
      block_hash:
        "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
      block_number: "0x1929c",
      data: "0x4992010000000000",
    },
    maximumCapacity: 100007690204n,
    since: 2305854004413868270n,
    depositBlockHash:
      "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    withdrawBlockHash:
      "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
    header: undefined,
  },
];

const depositDao =
  "0x8eedf002d7c88852433518952edc28002dd416364532c50800d096d05aac0200";
const withdrawDao =
  "0x39d32247d33f90523d37dae613dd280037e9cc1d7b01c708003d8849d8ac0200";

async function* cellCollector(_, fromScript) {
  for (const info of inputInfos) {
    const lock = info.cell.cell_output.lock;
    if (
      lock.code_hash === fromScript.code_hash &&
      lock.hash_type === fromScript.hash_type
    ) {
      yield info;
    }
  }
}

const cellProvider = new CellProvider([]);
let txSkeleton = TransactionSkeleton({ cellProvider });

const devConfig = Object.assign(
  {},
  {
    PREFIX: "ckt",
    SCRIPTS: {
      SECP256K1_BLAKE160: {
        CODE_HASH:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        HASH_TYPE: "type",
        TX_HASH:
          // "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
          "0x785aa819c8f9f8565a62f744685f8637c1b34886e57154e4e5a2ac7f225c7bf5",
        INDEX: "0x0",
        DEP_TYPE: "dep_group",
        SHORT_ID: 0,
      },
      SECP256K1_BLAKE160_MULTISIG: {
        CODE_HASH:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        HASH_TYPE: "type",
        TX_HASH:
          // "0x6495cede8d500e4309218ae50bbcadb8f722f24cc7572dd2274f5876cb603e4e",
          "0x785aa819c8f9f8565a62f744685f8637c1b34886e57154e4e5a2ac7f225c7bf5",
        INDEX: "0x1",
        DEP_TYPE: "dep_group",
        SHORT_ID: 1,
      },
      DAO: {
        CODE_HASH:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        HASH_TYPE: "type",
        TX_HASH:
          // "0x96fea0dfaac1186fbb98fd452cb9b13976f9a00bcce130035fe2e30dac931d1d",
          "0x13c137fdf071c0ab3e6a4c8aaefc16c9bb7b9593b77822b151b18412ecd2ee41",
        INDEX: "0x2",
        DEP_TYPE: "code",
      },
    },
  }
);

const tipHeader = {
  compact_target: "0x20010000",
  dao: "0x443110aefc4d1b55b10353894c2a29001e664c552fd16409005ef48f09d50200",
  epoch: "0xa0007002b16",
  hash: "0xf77591af1c30a65d5aec4c4753a3e967ecbcb850f90a9a63f59a4e513029d135",
  nonce: "0x8d543978c6abec5d9924183a39e2eeb0",
  number: "0x1aee3",
  parent_hash:
    "0x421f28afb4187d8034bb3895b671aa183e759f23036a744c792ff9c90b293c9d",
  proposals_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x172b772235e",
  transactions_root:
    "0xb8b4cee50a21a4c494d8eb4e34f6232fa72129fa9d7a2e4b09417ae224a43ebd",
  uncles_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};
const aliceAddress = "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v";
const bobAddress = "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83";

const fromInfo = {
  R: 0,
  M: 1,
  publicKeyHashes: ["0x36c329ed630d6ce750712a477543672adab57f4c"],
  // since: 0,
};

test("transfer multisig", async (t) => {
  txSkeleton = await transfer(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BigInt(500 * 10 ** 8),
    tipHeader,
    { config: devConfig, cellCollector }
  );

  // t.log(txSkeleton)

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);
  t.is(txSkeleton.get("inputSinces").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").size, 0);
});

test("prepareSigningEntries, multisig", async (t) => {
  txSkeleton = await transfer(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BigInt(500 * 10 ** 8),
    tipHeader,
    { config: devConfig, cellCollector }
  );

  txSkeleton = await prepareSigningEntries(txSkeleton, { config: devConfig });

  t.is(txSkeleton.get("signingEntries").size, 1);

  const expectedMessage =
    "0x185fb55177cefec3187c681889d10f85bb142400bf9817dd68b4efb5b51b9b04";

  const signingEntry = txSkeleton.get("signingEntries").get(0);
  t.is(signingEntry.index, 0);
  t.is(signingEntry.type, "witness_args_lock");
  t.is(signingEntry.message, expectedMessage);
});

test("transfer multisig & dao", async (t) => {
  txSkeleton = await transfer(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BigInt(2500 * 10 ** 8),
    tipHeader,
    { config: devConfig, cellCollector }
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const interest =
    calculateMaximumWithdraw(inputInfos[2].cell, depositDao, withdrawDao) -
    BigInt(inputInfos[2].cell.cell_output.capacity);

  t.is(sumOfOutputCapacity, sumOfInputCapacity + interest);

  t.is(txSkeleton.get("inputs").size, 3);
  t.is(txSkeleton.get("witnesses").size, 3);
  t.is(txSkeleton.get("inputSinces").size, 3);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 2);

  const expectedWitnesses = [
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0x61000000100000005500000061000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000",
  ];

  t.true(txSkeleton.get("witnesses").equals(List(expectedWitnesses)));
});

test("prepareSigningEntries, multisig & dao", async (t) => {
  txSkeleton = await transfer(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BigInt(2500 * 10 ** 8),
    tipHeader,
    { config: devConfig, cellCollector }
  );

  txSkeleton = await prepareSigningEntries(txSkeleton, { config: devConfig });

  t.is(txSkeleton.get("signingEntries").size, 3);

  const expectedMessages = [
    "0x98d2c7a0f7293f7cc95383f9bfd3559db148b661559684b2109c3ee22dc261f6",
    "0x98d2c7a0f7293f7cc95383f9bfd3559db148b661559684b2109c3ee22dc261f6",
    "0x8c34fa355fc0b13cca51e3a9ee9926b1f35795dc22f986d5596fc443321bdc44",
  ];

  expectedMessages.forEach((expectedMessage, index) => {
    const message = txSkeleton
      .get("signingEntries")
      .find((s) => s.type === "witness_args_lock" && s.index === index).message;
    t.is(message, expectedMessage);
  });
});

test("payFee, multisig & dao", async (t) => {
  txSkeleton = await transfer(
    txSkeleton,
    [fromInfo, aliceAddress],
    bobAddress,
    BigInt(2500 * 10 ** 8),
    tipHeader,
    { config: devConfig, cellCollector }
  );

  const fee = BigInt(1 * 10 ** 8);
  txSkeleton = await payFee(
    txSkeleton,
    [fromInfo, aliceAddress],
    fee,
    tipHeader,
    { config: devConfig, cellCollector }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const interest =
    calculateMaximumWithdraw(inputInfos[2].cell, depositDao, withdrawDao) -
    BigInt(inputInfos[2].cell.cell_output.capacity);

  t.is(sumOfOutputCapacity, sumOfInputCapacity + interest - fee);

  t.is(txSkeleton.get("inputs").size, 3);
  t.is(txSkeleton.get("witnesses").size, 3);
  t.is(txSkeleton.get("inputSinces").size, 3);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 2);
});
