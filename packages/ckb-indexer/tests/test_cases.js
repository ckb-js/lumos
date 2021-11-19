// The mocked database has indexed the first 100 blocks of Lina mainnet.

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
const lockInNervosDAO = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x6a506c138d0efd50b119d22b7b2404a53fe7ac98",
};

const lockInTxWithOutputsData = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x19c5d58c535273452ac60f9d37831601adcf12b8",
};

const type = {
  code_hash:
    "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
  hash_type: "type",
  args: "0x",
};

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
  {
    desc: "Test indexer subscribe by type script",
    queryOption: {
      type: type,
    },
    expectedResult: 2,
  },
  {
    desc: "Test indexer subscribe by lock script",
    queryOption: {
      lock: lockInTxWithOutputsData,
      data: "0x5468616e6b20796f75205361746f7368692e",
    },
    expectedResult: 1,
  },
];

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
      lock: lockInNervosDAO,
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

const cellsWithBlockHash = [
  {
    cell_output: {
      capacity: "0x66858222c400",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
      index: "0x22c",
    },
    block_hash:
      "0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5",
    block_number: "0x0",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91ea879",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xdd01a213077bdb161c7f5ef5071e15b911ba5d1692148f8c7a009873610eedbf",
      index: "0x0",
    },
    block_hash:
      "0x7bb56e1288a1de98bab23d3e0ec7728634b6626ab03cc119ec23005a82ff12ff",
    block_number: "0x1a",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9f7b",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x4e0de194a66c6531db6126c7da4757b7ded52f7e8c18458d5004b15527ee381e",
      index: "0x0",
    },
    block_hash:
      "0x21d6e5b949392186a6510c57da615f086f779b713a7f3d54c82a07d443e85c5d",
    block_number: "0x28",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9ce9",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x6f1d843719fa2a00d90e779751adeb173491daa16d4bafedca72b93f0c1ab3e1",
      index: "0x0",
    },
    block_hash:
      "0x3ea3a5122344ceb335ff776dbfa5f3e5a06b6edd965414f287f0d57f92304c89",
    block_number: "0x2c",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9ba1",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xa6859d41d4a27d20ae7836a6da7ce6cae3c517eb9c659663ee3b8587e80376d7",
      index: "0x0",
    },
    block_hash:
      "0x1255b3b013addc93fb0301ad2a4150d15e6c1a1c4badbc653fc821b127a37929",
    block_number: "0x2e",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e8ab9",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x43f0a6391b533a6c81c5a90cab920da926925c7285d3dfe63fa360ad8a7fbe53",
      index: "0x0",
    },
    block_hash:
      "0x2c96b715a2e2fe5602d518d75bc4912e6be16f34d9f1f2f420ff6e6de40c9379",
    block_number: "0x54",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e8386",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xde08dd73935e74948997268b97bdbfe03c98dd27a7cb3fbfbd6fdfe64a6a9ccf",
      index: "0x0",
    },
    block_hash:
      "0x02bfadbf60172d77af71ad141536d14f5ba191b40b5cffb2b2e7905459e8d500",
    block_number: "0x5d",
    data: "0x",
  },
];
const queryWithBlockHash = {
  queryOption: {
    lock: lock,
  },
  expectedResult: cellsWithBlockHash,
}
const cellsByLock = [
  {
    cell_output: {
      capacity: "0x66858222c400",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
      index: "0x22c",
    },
    // block_hash:
    //   "0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5",
    block_number: "0x0",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91ea879",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xdd01a213077bdb161c7f5ef5071e15b911ba5d1692148f8c7a009873610eedbf",
      index: "0x0",
    },
    // block_hash:
    //   "0x7bb56e1288a1de98bab23d3e0ec7728634b6626ab03cc119ec23005a82ff12ff",
    block_number: "0x1a",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9f7b",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x4e0de194a66c6531db6126c7da4757b7ded52f7e8c18458d5004b15527ee381e",
      index: "0x0",
    },
    // block_hash:
    //   "0x21d6e5b949392186a6510c57da615f086f779b713a7f3d54c82a07d443e85c5d",
    block_number: "0x28",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9ce9",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x6f1d843719fa2a00d90e779751adeb173491daa16d4bafedca72b93f0c1ab3e1",
      index: "0x0",
    },
    // block_hash:
    //   "0x3ea3a5122344ceb335ff776dbfa5f3e5a06b6edd965414f287f0d57f92304c89",
    block_number: "0x2c",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e9ba1",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xa6859d41d4a27d20ae7836a6da7ce6cae3c517eb9c659663ee3b8587e80376d7",
      index: "0x0",
    },
    // block_hash:
    //   "0x1255b3b013addc93fb0301ad2a4150d15e6c1a1c4badbc653fc821b127a37929",
    block_number: "0x2e",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e8ab9",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0x43f0a6391b533a6c81c5a90cab920da926925c7285d3dfe63fa360ad8a7fbe53",
      index: "0x0",
    },
    // block_hash:
    //   "0x2c96b715a2e2fe5602d518d75bc4912e6be16f34d9f1f2f420ff6e6de40c9379",
    block_number: "0x54",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x1ad91e8386",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
      },
      type: null,
    },
    out_point: {
      tx_hash:
        "0xde08dd73935e74948997268b97bdbfe03c98dd27a7cb3fbfbd6fdfe64a6a9ccf",
      index: "0x0",
    },
    // block_hash:
    //   "0x02bfadbf60172d77af71ad141536d14f5ba191b40b5cffb2b2e7905459e8d500",
    block_number: "0x5d",
    data: "0x",
  },
];

const cellsByLockBetween10And90 = [
  cellsByLock[1],
  cellsByLock[2],
  cellsByLock[3],
  cellsByLock[4],
  cellsByLock[5],
];

const cellsByLockSkip5 = [cellsByLock[5], cellsByLock[6]];

const cellsByLockDesc = [
  cellsByLock[0],
  cellsByLock[1],
  cellsByLock[2],
  cellsByLock[3],
  cellsByLock[4],
  cellsByLock[5],
  cellsByLock[6],
].reverse();

const cellsByLockDescThenSkip5 = [cellsByLock[1], cellsByLock[0]];

const cellsByType = [
  {
    cell_output: {
      capacity: "0x47e5e9f0c",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xb5a27e6b01d309135b06089ce192a267ceada8ea",
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
        "0x1fdfec93d515009759b6c0a029775143bdeaa9b9883216fc82589cc53e17c195",
      index: "0x0",
    },
    // block_hash:
    //   "0x4cc7b42c12e0ed1c87c3ced726e419ba19f755be1739097d6758b6bf60c654ad",
    block_number: "0x40",
    data: "0x0000000000000000",
  },
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x6a506c138d0efd50b119d22b7b2404a53fe7ac98",
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
        "0x8bc43f5819bfcc32a840c0f60d9eafe6bde3a67f9f018eb258783afc60798a07",
      index: "0x0",
    },
    // block_hash:
    //   "0xd4b10e5af3dac133888f47baeda057f7760fb4f81b2f4dc03a29c228c7dba7a0",
    block_number: "0x46",
    data: "0x0000000000000000",
  },
];

const cellsByLockAndType = [cellsByType[1]];

const cellCollectorTestCases = [
  {
    desc: "Test query cells by lock script",
    queryOption: {
      lock: lock,
    },
    expectedResult: cellsByLock,
  },
  {
    desc: "Test query cells by lock script and between [10,90] block range",
    queryOption: {
      lock: lock,
      fromBlock: "0xa", // 10
      toBlock: "0x5a", // 90
    },
    expectedResult: cellsByLockBetween10And90,
  },
  {
    desc: "Test query cells by lock script and skip the first 5 cells",
    queryOption: {
      lock: lock,
      skip: 5,
    },
    expectedResult: cellsByLockSkip5,
  },
  {
    desc: "Test query cells by lock script and return the cells in desc order",
    queryOption: {
      lock: lock,
      order: "desc",
    },
    expectedResult: cellsByLockDesc,
  },
  {
    desc:
      "Test query cells by lock script, return the cells in desc order then skip the first 5 cells",
    queryOption: {
      lock: lock,
      skip: 5,
      order: "desc",
    },
    expectedResult: cellsByLockDescThenSkip5,
  },
  {
    desc: "Test query cells by lock script with argsLen as number",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: 20,
    },
    expectedResult: cellsByLock,
  },
  {
    desc: "Test query cells by lock script with argsLen as any",
    queryOption: {
      lock: lockWithArgsPrefix,
      argsLen: "any",
    },
    expectedResult: cellsByLock,
  },
  {
    desc: "Test query cells by nonexist lock script",
    queryOption: {
      lock: nonexistLock,
    },
    expectedResult: [],
  },
  {
    desc: "Test query cells by type script",
    queryOption: {
      type: type,
    },
    expectedResult: cellsByType,
  },
  {
    desc:
      "Test query cells by both lock and type script and return nonempty result",
    queryOption: {
      lock: lockInNervosDAO,
      type: type,
    },
    expectedResult: cellsByLockAndType,
  },
  {
    desc: "Test query cells by both lock and type script",
    queryOption: {
      lock: lock,
      type: type,
    },
    expectedResult: [],
  },
  {
    desc: "Test query cells by both lock and empty type script",
    queryOption: {
      lock: lock,
      type: "empty",
    },
    expectedResult: cellsByLock,
  },
  {
    desc:
      "Test query cells by both lock and empty type script and return empty result",
    queryOption: {
      lock: lockInNervosDAO,
      type: "empty",
    },
    expectedResult: [],
  },
  {
    desc:
      "Test query cells by bufferSize 3 and can get all",
      queryOption: {
        lock: lock,
        bufferSize: 3
      },
    expectedResult: cellsByLock,
  },
];

module.exports = {
  lock,
  type,
  indexerSubscribeTestCases,
  transactionCollectorTestCases,
  cellCollectorTestCases,
  queryWithBlockHash
};
