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

const transactionHashesByLock = [
  "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
  "0xdd01a213077bdb161c7f5ef5071e15b911ba5d1692148f8c7a009873610eedbf",
  "0x4e0de194a66c6531db6126c7da4757b7ded52f7e8c18458d5004b15527ee381e",
  "0x6f1d843719fa2a00d90e779751adeb173491daa16d4bafedca72b93f0c1ab3e1",
  "0xa6859d41d4a27d20ae7836a6da7ce6cae3c517eb9c659663ee3b8587e80376d7",
  "0x43f0a6391b533a6c81c5a90cab920da926925c7285d3dfe63fa360ad8a7fbe53",
  "0xde08dd73935e74948997268b97bdbfe03c98dd27a7cb3fbfbd6fdfe64a6a9ccf",
];

const transactionHashesByLockBetween10And90 = [
  transactionHashesByLock[1],
  transactionHashesByLock[2],
  transactionHashesByLock[3],
  transactionHashesByLock[4],
  transactionHashesByLock[5],
];

const transactionHashesByLockSkip5 = [
  transactionHashesByLock[5],
  transactionHashesByLock[6],
];

const transactionHashesByLockDesc = [
  transactionHashesByLock[0],
  transactionHashesByLock[1],
  transactionHashesByLock[2],
  transactionHashesByLock[3],
  transactionHashesByLock[4],
  transactionHashesByLock[5],
  transactionHashesByLock[6],
].reverse();

const transactionHashesByLockDescThenSkip5 = [
  transactionHashesByLock[1],
  transactionHashesByLock[0],
];

const transactionHashesByType = [
  "0x1fdfec93d515009759b6c0a029775143bdeaa9b9883216fc82589cc53e17c195",
  "0x8bc43f5819bfcc32a840c0f60d9eafe6bde3a67f9f018eb258783afc60798a07",
];

const transactionHashesByLockAndType = [
  "0x8bc43f5819bfcc32a840c0f60d9eafe6bde3a67f9f018eb258783afc60798a07",
];
// The mocked database has indexed the first 100 blocks of Lina mainnet.
const transactionCollectorTestCases = [
  {
    desc: "Test query transactions by lock script",
    queryOption: {
      lock: lock,
    },
    expectedResult: transactionHashesByLock,
  },
  {
    desc: "Test query transactions by lock script and ioType = output",
    queryOption: {
      lock: {
        script: lock,
        ioType: "output",
      },
    },
    expectedResult: transactionHashesByLock,
  },
  {
    desc: "Test query transactions by lock script and ioType = both",
    queryOption: {
      lock: {
        script: lock,
        ioType: "both",
      },
    },
    expectedResult: transactionHashesByLock,
  },
  {
    desc: "Test query transactions by lock script and ioType = input",
    queryOption: {
      lock: {
        script: lock,
        ioType: "input",
      },
    },
    expectedResult: [],
  },
  {
    desc:
      "Test query transactions by lock script and between [10,90] block range",
    queryOption: {
      lock: lock,
      fromBlock: "0xa", // 10
      toBlock: "0x5a", // 90
    },
    expectedResult: transactionHashesByLockBetween10And90,
  },
  {
    desc:
      "Test query transactions by lock script and skip the first 5 transactions",
    queryOption: {
      lock: lock,
      skip: 5,
    },
    expectedResult: transactionHashesByLockSkip5,
  },
  {
    desc:
      "Test query transactions by lock script and return the transactions in desc order",
    queryOption: {
      lock: lock,
      order: "desc",
    },
    expectedResult: transactionHashesByLockDesc,
  },
  {
    desc:
      "Test query transactions by lock script, return the transactions in desc order then skip the first 5 transactions",
    queryOption: {
      lock: lock,
      skip: 5,
      order: "desc",
    },
    expectedResult: transactionHashesByLockDescThenSkip5,
  },
  {
    desc: "Test query transactions by lock script with argsLen as number",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: 20,
    },
    expectedResult: transactionHashesByLock,
  },
  {
    desc: "Test query transactions by lock script with argsLen as any",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: "any",
    },
    expectedResult: transactionHashesByLock,
  },
  {
    desc: "Test query transactions by nonexist lock script",
    queryOption: {
      lock: nonexistLock,
    },
    expectedResult: [],
  },
  {
    desc: "Test query transactions by type script",
    queryOption: {
      type: type,
    },
    expectedResult: transactionHashesByType,
  },
  {
    desc:
      "Test query transactions by both lock and type script and return nonempty result",
    queryOption: {
      lock: lock2,
      type: type,
    },
    expectedResult: transactionHashesByLockAndType,
  },
  {
    desc: "Test query transactions by both lock and type script",
    queryOption: {
      lock: lock,
      type: type,
    },
    expectedResult: [],
  },
  {
    desc: "Test query transactions by both lock and empty type script",
    queryOption: {
      lock: lock,
      type: "empty",
    },
    expectedResult: transactionHashesByLock,
  },
];

module.exports = { transactionCollectorTestCases };
