// The mocked database is based on the first 100 blocks of Lina Mainnet.

const lock = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
};

const lock_with_args_prefix = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa528f2b9a51118b193178db4cf2f3db92e7d",
};

// lock script that not exist in the mocked database.
const nonexist_lock = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x0e5e3ee1d580d3b5aaff5d430b2ca6c93684d575",
};

const type = {
  code_hash:
    "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
  hash_type: "type",
  args: "0x",
};

const cellCollectorTestData = [
  {
    queryOption: {
      lock: lock,
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x66858222c400",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
    ],
  },
  {
    queryOption: {
      lock: lock,
      fromBlock: "0xa", // 10
      toBlock: "0x5a", // 90
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x1ad91ea879",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
    ],
  },
  {
    queryOption: {
      lock: lock,
      skip: 5,
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x1ad91e8ab9",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
    ],
  },
  {
    queryOption: {
      lock: lock,
      skip: 3,
      order: "desc",
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x66858222c400",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
    ].reverse(),
  },
  {
    queryOption: {
      lock: lock_with_args_prefix,
      argsLen: 20,
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x66858222c400",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
    ],
  },
  {
    queryOption: {
      lock: lock_with_args_prefix,
      argsLen: "any",
    },
    expectedResult: [
      {
        cell_output: {
          capacity: "0x66858222c400",
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
          },
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
          type: undefined,
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
    ],
  },
  {
    queryOption: {
      lock: nonexist_lock,
    },
    expectedResult: [],
  },
  {
    queryOption: {
      type: type,
    },
    expectedResult: [
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
        block_hash:
          "0x4cc7b42c12e0ed1c87c3ced726e419ba19f755be1739097d6758b6bf60c654ad",
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
        block_hash:
          "0xd4b10e5af3dac133888f47baeda057f7760fb4f81b2f4dc03a29c228c7dba7a0",
        block_number: "0x46",
        data: "0x0000000000000000",
      },
    ],
  },
    {
        queryOption: {
            lock: lock,
            type: type,
        },
        expectedResult: [],
    },
];

module.exports = { cellCollectorTestData };
