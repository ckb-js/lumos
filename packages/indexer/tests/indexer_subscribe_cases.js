// scriptHash: 0x92c9f7cd9d88a98e01af65f964eaf2177d74a4597e32ddd1b27f83d78ea746a6,
// mainnetAddress: ckb1qyq2228jhxj3zx93jvtcmdx09u7mjtna7v3swm47cq
const lock = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
};

const lockWithArgsPrefix = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa528f2b9a51118b193178db4cf2f3db92e7d",
};

// lock script that not exist in the mocked database(which indexed the first 100 blocks of Lina mainnet).
const nonexistLock = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x0e5e3ee1d580d3b5aaff5d430b2ca6c93684d575",
};

// lock script that exist in a nervosdao deposit transaction: 0x8bc43f5819bfcc32a840c0f60d9eafe6bde3a67f9f018eb258783afc60798a07
const lock2 = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x6a506c138d0efd50b119d22b7b2404a53fe7ac98",
};

const type = {
  code_hash:
    "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
  hash_type: "type",
  args: "0x",
};

// The mocked database has indexed the first 100 blocks of Lina mainnet.
const indexerSubscribeTestCases = [
  {
    desc: "Test indexer subscribe by lock script",
    queryOption: {
      lock: lock,
    },
    expectedResult: 7,
  },
  {
    desc:
      "Test indexer subscribe by lock script and between [10, ~) block range",
    queryOption: {
      lock: lock,
      fromBlock: "0xa", // 10
    },
    expectedResult: 6,
  },
  {
    desc:
      "Test indexer subscribe by lock script and between [101, ~) block range",
    queryOption: {
      lock: lock,
      fromBlock: "0x65", // 101
    },
    expectedResult: 0,
  },
  {
    desc: "Test indexer subscribe by lock script with argsLen as number",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: 20,
    },
    expectedResult: 7,
  },
  {
    desc: "Test indexer subscribe by lock script with argsLen as any",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: "any",
    },
    expectedResult: 7,
  },
  {
    desc: "Test indexer subscribe by nonexist lock script",
    queryOption: {
      lock: nonexistLock,
    },
    expectedResult: 0,
  },
  {
    desc: "Test indexer subscribe by type script",
    queryOption: {
      type: type,
    },
    expectedResult: 2,
  },
  //{
  //  desc: "Test indexer subscribe by both lock and type script",
  //  queryOption: {
  //    lock: lock,
  //    type: type,
  //  },
  //  expectedResult: 9,
  //},
];

module.exports = { indexerSubscribeTestCases };
