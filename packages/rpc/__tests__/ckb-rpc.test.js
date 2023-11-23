/* eslint-disable max-len */
/** mock template start **/
jest.mock("cross-fetch");
const axiosMock = require("cross-fetch").default;

beforeAll(() => {
  const originalResolve = axiosMock.mockResolvedValue;
  axiosMock.mockResolvedValue = (value) =>
    originalResolve({
      json: () => Promise.resolve(value.data),
    });
});

/** mock template end **/

const { CKBRPC, ResultFormatter } = require("../lib");

describe("Test with mock", () => {
  const rpc = new CKBRPC("http://localhost:8114");
  const ranNum = 1;
  const id = Math.round(ranNum * 10000);

  beforeAll(() => {
    jest.spyOn(global.Math, "random").mockReturnValue(ranNum);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("properties", () => {
    expect(rpc.paramsFormatter).not.toBeUndefined();
    expect(rpc.resultFormatter).not.toBeUndefined();
    expect(rpc.node.url).toBe("http://localhost:8114");
  });

  describe("ckb-rpc success", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("get block by number", async () => {
      const BLOCK_NUMBER = "0x400";
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            header: {
              compact_target: "0x1e083126",
              dao: "0xb5a3e047474401001bc476b9ee573000c0c387962a38000000febffacf030000",
              epoch: "0x7080018000001",
              hash: "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
              nonce: "0x0",
              number: "0x400",
              parent_hash:
                "0xae003585fa15309b30b31aed3dcf385e9472c3c3e93746a6c4540629a6a1ed2d",
              proposals_hash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              timestamp: "0x5cd2b117",
              transactions_root:
                "0xc47d5b78b3c4c4c853e2a32810818940d0ee403423bea9ec7b8e566d9595206c",
              extra_hash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              version: "0x0",
            },
            proposals: [],
            transactions: [
              {
                cell_deps: [],
                hash: "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17",
                header_deps: [],
                inputs: [
                  {
                    previous_output: {
                      index: "0xffffffff",
                      tx_hash:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                    },
                    since: "0x400",
                  },
                ],
                outputs: [
                  {
                    capacity: "0x18e64b61cf",
                    lock: {
                      args: "0x",
                      code_hash:
                        "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                      hash_type: "data",
                    },
                    type: null,
                  },
                ],
                outputs_data: ["0x"],
                version: "0x0",
                witnesses: [
                  "0x450000000c000000410000003500000010000000300000003100000028e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5000000000000000000",
                ],
              },
            ],
            uncles: [],
            extension: "0x636b62",
          },
        },
      });
      const res = await rpc.getBlockByNumber(BLOCK_NUMBER);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_block_by_number",
        params: [BLOCK_NUMBER],
      });
      expect(res).toEqual({
        header: {
          compactTarget: "0x1e083126",
          dao: "0xb5a3e047474401001bc476b9ee573000c0c387962a38000000febffacf030000",
          epoch: "0x7080018000001",
          hash: "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          nonce: "0x0",
          number: "0x400",
          parentHash:
            "0xae003585fa15309b30b31aed3dcf385e9472c3c3e93746a6c4540629a6a1ed2d",
          proposalsHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          timestamp: "0x5cd2b117",
          transactionsRoot:
            "0xc47d5b78b3c4c4c853e2a32810818940d0ee403423bea9ec7b8e566d9595206c",
          extraHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          version: "0x0",
        },
        proposals: [],
        transactions: [
          {
            cellDeps: [],
            hash: "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17",
            headerDeps: [],
            inputs: [
              {
                previousOutput: {
                  index: "0xffffffff",
                  txHash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                },
                since: "0x400",
              },
            ],
            outputs: [
              {
                capacity: "0x18e64b61cf",
                lock: {
                  args: "0x",
                  codeHash:
                    "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                  hashType: "data",
                },
                type: null,
              },
            ],
            outputsData: ["0x"],
            version: "0x0",
            witnesses: [
              "0x450000000c000000410000003500000010000000300000003100000028e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5000000000000000000",
            ],
          },
        ],
        uncles: [],
        extension: "0x636b62",
      });
    });
    it("tx pool info", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            last_txs_updated_at: "0x0",
            min_fee_rate: "0x0",
            orphan: "0x0",
            pending: "0x1",
            proposed: "0x0",
            total_tx_cycles: "0x219",
            total_tx_size: "0x112",
          },
        },
      });
      const res = await rpc.txPoolInfo();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "tx_pool_info",
        params: [],
      });
      expect(res).toEqual({
        lastTxsUpdatedAt: "0x0",
        minFeeRate: "0x0",
        orphan: "0x0",
        pending: "0x1",
        proposed: "0x0",
        totalTxCycles: "0x219",
        totalTxSize: "0x112",
      });
    });

    it("clear tx pool", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: null,
        },
      });

      const res = await rpc.clearTxPool();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "clear_tx_pool",
        params: [],
      });
      expect(res).toBeNull();
    });

    describe("get raw tx pool", () => {
      it("verbose = true", async () => {
        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              proposed: {
                "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0":
                  {
                    ancestors_count: "0x1",
                    ancestors_cycles: "0x1a00e0",
                    ancestors_size: "0x1d0",
                    cycles: "0x1a00e0",
                    fee: "0x989680",
                    size: "0x1d0",
                  },
              },
              pending: {
                "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0":
                  {
                    ancestors_count: "0x1",
                    ancestors_cycles: "0x1a00e0",
                    ancestors_size: "0x1d0",
                    cycles: "0x1a00e0",
                    fee: "0x989680",
                    size: "0x1d0",
                  },
              },
            },
          },
        });

        const res = await rpc.getRawTxPool(true);
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_raw_tx_pool",
          params: [true],
        });
        expect(res).toEqual({
          proposed: {
            "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0":
              {
                ancestorsCount: "0x1",
                ancestorsCycles: "0x1a00e0",
                ancestorsSize: "0x1d0",
                cycles: "0x1a00e0",
                fee: "0x989680",
                size: "0x1d0",
              },
          },
          pending: {
            "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0":
              {
                ancestorsCount: "0x1",
                ancestorsCycles: "0x1a00e0",
                ancestorsSize: "0x1d0",
                cycles: "0x1a00e0",
                fee: "0x989680",
                size: "0x1d0",
              },
          },
        });
      });

      it("verbose = false", async () => {
        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              pending: [
                "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
              ],
              proposed: [],
            },
          },
        });

        const res = await rpc.getRawTxPool(false);
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_raw_tx_pool",
          params: [false],
        });
        expect(res).toEqual({
          pending: [
            "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
          ],
          proposed: [],
        });
      });

      it("verbose = null", async () => {
        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              pending: [
                "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
              ],
              proposed: [],
            },
          },
        });

        const res = await rpc.getRawTxPool(null);
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_raw_tx_pool",
          params: [null],
        });
        expect(res).toEqual({
          pending: [
            "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
          ],
          proposed: [],
        });
      });

      it("verbose = undefined", async () => {
        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              pending: [
                "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
              ],
              proposed: [],
            },
          },
        });

        const res = await rpc.getRawTxPool();
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_raw_tx_pool",
          params: [],
        });
        expect(res).toEqual({
          pending: [
            "0x272881d99bfa40ded47f408e1783ee15990b479ec462f11668cdd3445cc132b0",
          ],
          proposed: [],
        });
      });
    });

    it("get current epoch", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            compact_target: "0x1e083126",
            length: "0x708",
            number: "0x1",
            start_number: "0x3e8",
          },
        },
      });
      const res = await rpc.getCurrentEpoch();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_current_epoch",
        params: [],
      });
      expect(res).toEqual({
        compactTarget: "0x1e083126",
        length: "0x708",
        number: "0x1",
        startNumber: "0x3e8",
      });
    });
    it("get epoch by number", async () => {
      const BLOCK_NUMBER = "0x0";
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            compact_target: "0x20010000",
            length: "0x3e8",
            number: "0x0",
            start_number: "0x0",
          },
        },
      });
      const res = await rpc.getEpochByNumber(BLOCK_NUMBER);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_epoch_by_number",
        params: [BLOCK_NUMBER],
      });
      expect(res).toEqual({
        compactTarget: "0x20010000",
        length: "0x3e8",
        number: "0x0",
        startNumber: "0x0",
      });
    });
    it.skip("dryRunTransaction", async () => {});
    it("get cellbase output capacity details", async () => {
      const BLOCK_HASH =
        "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40";
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            primary: "0x18ce922bca",
            proposal_reward: "0x0",
            secondary: "0x17b93605",
            total: "0x18e64b61cf",
            tx_fee: "0x0",
          },
        },
      });
      const res = await rpc.getCellbaseOutputCapacityDetails(BLOCK_HASH);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_cellbase_output_capacity_details",
        params: [BLOCK_HASH],
      });
      expect(res).toEqual({
        primary: "0x18ce922bca",
        proposalReward: "0x0",
        secondary: "0x17b93605",
        total: "0x18e64b61cf",
        txFee: "0x0",
      });
    });
    it("calculate dao maximum withdraw", async () => {
      const PARAMS = [
        {
          index: "0x0",
          txHash:
            "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
        },
        "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
      ];
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: "0x4a8b4e8a4",
        },
      });
      const res = await rpc.calculateDaoMaximumWithdraw(...PARAMS);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "calculate_dao_maximum_withdraw",
        params: [
          {
            index: "0x0",
            tx_hash:
              "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
          },
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
      });
      expect(res).toBe("0x4a8b4e8a4");
    });
    it("get block economic state", async () => {
      const BLOCK_HASH =
        "0x02530b25ad0ff677acc365cb73de3e8cc09c7ddd58272e879252e199d08df83b";

      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            finalized_at:
              "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
            issuance: {
              primary: "0x18ce922bca",
              secondary: "0x7f02ec655",
            },
            miner_reward: {
              committed: "0x0",
              primary: "0x18ce922bca",
              proposal: "0x0",
              secondary: "0x17b93605",
            },
            txs_fee: "0x0",
          },
        },
      });
      const res = await rpc.getBlockEconomicState(BLOCK_HASH);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_block_economic_state",
        params: [BLOCK_HASH],
      });
      expect(res).toEqual({
        finalizedAt:
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        issuance: {
          primary: "0x18ce922bca",
          secondary: "0x7f02ec655",
        },
        minerReward: {
          committed: "0x0",
          primary: "0x18ce922bca",
          proposal: "0x0",
          secondary: "0x17b93605",
        },
        txsFee: "0x0",
      });
    });

    describe("get transaction proof", () => {
      it("with transaction hashes and block hash", async () => {
        const BLOCK_HASH =
          "0x02530b25ad0ff677acc365cb73de3e8cc09c7ddd58272e879252e199d08df83b";
        const TRANSACTION_HASHES = [
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ];

        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              block_hash:
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              proof: {
                indices: ["0x0"],
                lemmas: [
                  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                ],
              },
              witnesses_root:
                "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            },
          },
        });
        const res = await rpc.getTransactionProof(
          TRANSACTION_HASHES,
          BLOCK_HASH
        );
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_transaction_proof",
          params: [TRANSACTION_HASHES, BLOCK_HASH],
        });
        expect(res).toEqual({
          blockHash:
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          proof: {
            indices: ["0x0"],
            lemmas: [
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ],
          },
          witnessesRoot:
            "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        });
      });

      it("with transaction hashes and without block hash", async () => {
        const TRANSACTION_HASHES = [
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ];

        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result: {
              block_hash:
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              proof: {
                indices: ["0x0"],
                lemmas: [
                  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                ],
              },
              witnesses_root:
                "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            },
          },
        });
        const res = await rpc.getTransactionProof(TRANSACTION_HASHES);
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          method: "get_transaction_proof",
          params: [TRANSACTION_HASHES],
        });
        expect(res).toEqual({
          blockHash:
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          proof: {
            indices: ["0x0"],
            lemmas: [
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ],
          },
          witnessesRoot:
            "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        });
      });
    });
    it("verify transaction proof", async () => {
      const TRANSACTION_PROOF = {
        blockHash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        proof: {
          indices: ["0x0"],
          lemmas: [
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          ],
        },
        witnessesRoot:
          "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      };
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: [
            "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
          ],
        },
      });
      const res = await rpc.verifyTransactionProof(TRANSACTION_PROOF);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "verify_transaction_proof",
        params: [
          {
            block_hash: TRANSACTION_PROOF.blockHash,
            proof: TRANSACTION_PROOF.proof,
            witnesses_root: TRANSACTION_PROOF.witnessesRoot,
          },
        ],
      });
      expect(res).toEqual([
        "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
      ]);
    });

    it("get consensus", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            block_version: "0x0",
            cellbase_maturity: "0x10000000000",
            dao_type_hash:
              "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
            epoch_duration_target: "0x3840",
            genesis_hash:
              "0x746f61610a0ea15713a568182365c0f4d8bcd2f61d42c91abc9279d4e858a190",
            hardfork_features: [
              {
                epoch_number: "0x0",
                rfc: "0028",
              },
              {
                epoch_number: "0x0",
                rfc: "0029",
              },
              {
                epoch_number: "0x0",
                rfc: "0030",
              },
              {
                epoch_number: "0x0",
                rfc: "0031",
              },
              {
                epoch_number: "0x0",
                rfc: "0032",
              },
              {
                epoch_number: "0x0",
                rfc: "0036",
              },
              {
                epoch_number: "0x0",
                rfc: "0038",
              },
              {
                epoch_number: null,
                rfc: "0048",
              },
              {
                epoch_number: null,
                rfc: "0049",
              },
            ],
            id: "ckb_dev",
            initial_primary_epoch_reward: "0xae6c73c3e070",
            max_block_bytes: "0x91c08",
            max_block_cycles: "0x2540be400",
            max_block_proposals_limit: "0x5dc",
            max_uncles_num: "0x2",
            median_time_block_count: "0x25",
            orphan_rate_target: {
              denom: "0x28",
              numer: "0x1",
            },
            permanent_difficulty_in_dummy: true,
            primary_epoch_reward_halving_interval: "0x2238",
            proposer_reward_ratio: {
              denom: "0xa",
              numer: "0x4",
            },
            secondary_epoch_reward: "0x37d0c8e28542",
            secp256k1_blake160_multisig_all_type_hash:
              "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
            secp256k1_blake160_sighash_all_type_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            softforks: {
              light_client: {
                rfc0043: {
                  bit: 1,
                  min_activation_epoch: "0x0",
                  period: "0xa",
                  start: "0x0",
                  threshold: {
                    denom: "0x4",
                    numer: "0x3",
                  },
                  timeout: "0x0",
                },
                status: "rfc0043",
              },
            },
            tx_proposal_window: {
              closest: "0x2",
              farthest: "0xa",
            },
            tx_version: "0x0",
            type_id_code_hash:
              "0x00000000000000000000000000000000000000000000000000545950455f4944",
          },
        },
      });
      const res = await rpc.getConsensus();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_consensus",
        params: [],
      });
      expect(res).toEqual({
        blockVersion: "0x0",
        cellbaseMaturity: "0x10000000000",
        daoTypeHash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        epochDurationTarget: "0x3840",
        genesisHash:
          "0x746f61610a0ea15713a568182365c0f4d8bcd2f61d42c91abc9279d4e858a190",
        id: "ckb_dev",
        initialPrimaryEpochReward: "0xae6c73c3e070",
        maxBlockBytes: "0x91c08",
        maxBlockCycles: "0x2540be400",
        maxBlockProposalsLimit: "0x5dc",
        maxUnclesNum: "0x2",
        medianTimeBlockCount: "0x25",
        orphanRateTarget: { denom: "0x28", numer: "0x1" },
        permanentDifficultyInDummy: true,
        primaryEpochRewardHalvingInterval: "0x2238",
        proposerRewardRatio: { denom: "0xa", numer: "0x4" },
        secondaryEpochReward: "0x37d0c8e28542",
        secp256k1Blake160MultisigAllTypeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        secp256k1Blake160SighashAllTypeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        txProposalWindow: { closest: "0x2", farthest: "0xa" },
        txVersion: "0x0",
        typeIdCodeHash:
          "0x00000000000000000000000000000000000000000000000000545950455f4944",
        hardforkFeatures: [
          { rfc: "0028", epochNumber: "0x0" },
          { rfc: "0029", epochNumber: "0x0" },
          { rfc: "0030", epochNumber: "0x0" },
          { rfc: "0031", epochNumber: "0x0" },
          { rfc: "0032", epochNumber: "0x0" },
          { rfc: "0036", epochNumber: "0x0" },
          { rfc: "0038", epochNumber: "0x0" },
          { rfc: "0048", epochNumber: null },
          { rfc: "0049", epochNumber: null },
        ],
        softforks: {
          lightClient: {
            status: "rfc0043",
            rfc0043: {
              bit: 1,
              start: "0x0",
              timeout: "0x0",
              minActivationEpoch: "0x0",
              period: "0xa",
              threshold: { denom: "0x4", numer: "0x3" },
            },
          },
        },
      });
    });

    it("get blockchain info", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            alerts: [],
            chain: "ckb_dev",
            difficulty: "0x100",
            epoch: "0xa00090000e2",
            is_initial_block_download: true,
            median_time: "0x172a87eeab0",
          },
          id,
        },
      });
      const res = await rpc.getBlockchainInfo();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_blockchain_info",
        params: [],
      });
      expect(res).toEqual({
        alerts: [],
        chain: "ckb_dev",
        difficulty: "0x100",
        epoch: "0xa00090000e2",
        isInitialBlockDownload: true,
        medianTime: "0x172a87eeab0",
      });
    });

    it("local node info", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            active: true,
            addresses: [
              {
                address:
                  "/ip4/192.168.0.2/tcp/8112/p2p/QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
                score: "0xff",
              },
            ],
            connections: "0xb",
            node_id: "QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
            protocols: [
              {
                id: "0x0",
                name: "/ckb/ping",
                support_versions: ["0.0.1"],
              },
            ],
            version: "0.34.0 (f37f598 2020-07-17)",
          },
          id,
        },
      });
      const res = await rpc.localNodeInfo();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "local_node_info",
        params: [],
      });
      expect(res).toEqual({
        active: true,
        addresses: [
          {
            address:
              "/ip4/192.168.0.2/tcp/8112/p2p/QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
            score: "0xff",
          },
        ],
        connections: "0xb",
        nodeId: "QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
        protocols: [
          {
            id: "0x0",
            name: "/ckb/ping",
            supportVersions: ["0.0.1"],
          },
        ],
        version: "0.34.0 (f37f598 2020-07-17)",
      });
    });

    it("get peers", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: [],
          id,
        },
      });
      const res = await rpc.getPeers();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_peers",
        params: [],
      });
      expect(res).toEqual([]);
    });

    it("get tip block number", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: "0x8dd",
          id,
        },
      });
      const res = await rpc.getTipBlockNumber();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_tip_block_number",
        params: [],
      });
      expect(res).toBe("0x8dd");
    });

    it("get block hash", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result:
            "0x120ab9abd48e3b82f93b88eba8c50a0e1304cc2fffb5573fb14b56c6348f2305",
          id,
        },
      });
      const res = await rpc.getBlockHash("0x0");
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_block_hash",
        params: ["0x0"],
      });
      expect(res).toBe(
        "0x120ab9abd48e3b82f93b88eba8c50a0e1304cc2fffb5573fb14b56c6348f2305"
      );
    });

    it("get block", async () => {
      const BLOCK_HASH =
        "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4";
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            header: {
              compact_target: "0x20010000",
              dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
              epoch: "0xa00090000e2",
              hash: BLOCK_HASH,
              nonce: "0x3388940124a1004051e37eb039a3dfeb",
              number: "0x8dd",
              parent_hash:
                "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
              proposals_hash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              timestamp: "0x172a8804ad1",
              transactions_root:
                "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
              extra_hash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              version: "0x0",
            },
            proposals: [],
            transactions: [
              {
                cell_deps: [],
                hash: "0x638f645b153c543acc63a884cf2423499bd2774b42d7dd96bd8b50ddc4b5c038",
                header_deps: [],
                inputs: [
                  {
                    previous_output: {
                      index: "0xffffffff",
                      tx_hash:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                    },
                    since: "0x8dd",
                  },
                ],
                outputs: [
                  {
                    capacity: "0x12440cbf2a1e",
                    lock: {
                      args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
                      code_hash:
                        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                      hash_type: "type",
                    },
                    type: null,
                  },
                ],
                outputs_data: ["0x"],
                version: "0x0",
                witnesses: [
                  "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
                ],
              },
            ],
            uncles: [],
          },
          id,
        },
      });

      const res = await rpc.getBlock(BLOCK_HASH);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_block",
        params: [BLOCK_HASH],
      });
      expect(res).toEqual({
        header: {
          compactTarget: "0x20010000",
          dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
          epoch: "0xa00090000e2",
          hash: BLOCK_HASH,
          nonce: "0x3388940124a1004051e37eb039a3dfeb",
          number: "0x8dd",
          parentHash:
            "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
          proposalsHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          timestamp: "0x172a8804ad1",
          transactionsRoot:
            "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
          extraHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          version: "0x0",
        },
        proposals: [],
        transactions: [
          {
            cellDeps: [],
            hash: "0x638f645b153c543acc63a884cf2423499bd2774b42d7dd96bd8b50ddc4b5c038",
            headerDeps: [],
            inputs: [
              {
                previousOutput: {
                  index: "0xffffffff",
                  txHash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                },
                since: "0x8dd",
              },
            ],
            outputs: [
              {
                capacity: "0x12440cbf2a1e",
                lock: {
                  args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
                  codeHash:
                    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                  hashType: "type",
                },
                type: null,
              },
            ],
            outputsData: ["0x"],
            version: "0x0",
            witnesses: [
              "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
            ],
          },
        ],
        uncles: [],
      });
    });

    it("get tip header", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            compact_target: "0x20010000",
            dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
            epoch: "0xa00090000e2",
            hash: "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4",
            nonce: "0x3388940124a1004051e37eb039a3dfeb",
            number: "0x8dd",
            parent_hash:
              "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
            proposals_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            timestamp: "0x172a8804ad1",
            transactions_root:
              "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
            extra_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            version: "0x0",
          },
          id,
        },
      });
      const res = await rpc.getTipHeader();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_tip_header",
        params: [],
      });
      expect(res).toEqual({
        compactTarget: "0x20010000",
        dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
        epoch: "0xa00090000e2",
        hash: "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4",
        nonce: "0x3388940124a1004051e37eb039a3dfeb",
        number: "0x8dd",
        parentHash:
          "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
        proposalsHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: "0x172a8804ad1",
        transactionsRoot:
          "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
        extraHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        version: "0x0",
      });
    });

    it("get transaction", async () => {
      const TX_HASH =
        "0xc4a69f70877c2e00897191e0ca81edc8ad14ff81b8049c9d66523df7e365524f";
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            transaction: {
              cell_deps: [],
              hash: TX_HASH,
              header_deps: [],
              inputs: [
                {
                  previous_output: {
                    index: "0xffffffff",
                    tx_hash:
                      "0x0000000000000000000000000000000000000000000000000000000000000000",
                  },
                  since: "0x8dc",
                },
              ],
              outputs: [
                {
                  capacity: "0x12440d255842",
                  lock: {
                    args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
                    code_hash:
                      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                    hash_type: "type",
                  },
                  type: null,
                },
              ],
              outputs_data: ["0x"],
              version: "0x0",
              witnesses: [
                "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
              ],
            },
            tx_status: {
              block_hash:
                "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
              status: "committed",
            },
          },
          id,
        },
      });
      const res = await rpc.getTransaction(TX_HASH);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_transaction",
        params: [TX_HASH],
      });
      expect(res).toEqual({
        transaction: {
          cellDeps: [],
          hash: "0xc4a69f70877c2e00897191e0ca81edc8ad14ff81b8049c9d66523df7e365524f",
          headerDeps: [],
          inputs: [
            {
              previousOutput: {
                index: "0xffffffff",
                txHash:
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
              },
              since: "0x8dc",
            },
          ],
          outputs: [
            {
              capacity: "0x12440d255842",
              lock: {
                args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
                codeHash:
                  "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                hashType: "type",
              },
              type: null,
            },
          ],
          outputsData: ["0x"],
          version: "0x0",
          witnesses: [
            "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
          ],
        },
        txStatus: {
          blockHash:
            "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
          status: "committed",
        },
      });
    });

    it("get live cell", async () => {
      const OUT_POINT = {
        txHash:
          "0xc4a69f70877c2e00897191e0ca81edc8ad14ff81b8049c9d66523df7e365524f",
        index: "0x0",
      };
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            cell: {
              data: {
                content: "0x",
                hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
              },
              output: {
                capacity: "0x12440d255842",
                lock: {
                  args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
                  code_hash:
                    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                  hash_type: "type",
                },
                type: null,
              },
            },
            status: "live",
          },
          id,
        },
      });
      const res = await rpc.getLiveCell(OUT_POINT, true);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_live_cell",
        params: [
          {
            tx_hash:
              "0xc4a69f70877c2e00897191e0ca81edc8ad14ff81b8049c9d66523df7e365524f",
            index: "0x0",
          },
          true,
        ],
      });
      expect(res).toEqual({
        cell: {
          data: {
            content: "0x",
            hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          output: {
            capacity: "0x12440d255842",
            lock: {
              args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
              codeHash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hashType: "type",
            },
            type: null,
          },
        },
        status: "live",
      });
    });

    it("get banned addresses", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: [],
          id,
        },
      });
      const res = await rpc.getBannedAddresses();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_banned_addresses",
        params: [],
      });
      expect(res).toEqual([]);
    });

    it("clear banned addresses", async () => {
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: null,
          id,
        },
      });
      const res = await rpc.clearBannedAddresses();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "clear_banned_addresses",
        params: [],
      });
      expect(res).toBeNull();
    });

    it("set address to be banned", async () => {
      const PARAMS = ["1.1.1.1", "insert", null, true, "No reason"];
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: null,
          id,
        },
      });
      const res = await rpc.setBan(...PARAMS);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "set_ban",
        params: PARAMS,
      });
      expect(res).toBeNull();
    });

    it("get sync state", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: {
            best_known_block_number: "0x248623",
            best_known_block_timestamp: "0x173943c36e4",
            fast_time: "0x3e8",
            ibd: false,
            inflight_blocks_count: "0x0",
            low_time: "0x5dc",
            normal_time: "0x4e2",
            orphan_blocks_count: "0x0",
          },
        },
      });
      const res = await rpc.syncState();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "sync_state",
        params: [],
      });
      expect(res).toEqual({
        bestKnownBlockNumber: "0x248623",
        bestKnownBlockTimestamp: "0x173943c36e4",
        fastTime: "0x3e8",
        ibd: false,
        inflightBlocksCount: "0x0",
        lowTime: "0x5dc",
        normalTime: "0x4e2",
        orphanBlocksCount: "0x0",
      });
    });

    it("set network active", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: null,
        },
      });
      const res = await rpc.setNetworkActive(false);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "set_network_active",
        params: [false],
      });
      expect(res).toBeNull();
    });

    it("add node", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: null,
        },
      });
      const PEER_ID = "peer id";
      const ADDRESS = "address";
      const res = await rpc.addNode(PEER_ID, ADDRESS);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "add_node",
        params: [PEER_ID, ADDRESS],
      });
      expect(res).toBeNull();
    });

    it("remove node", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: null,
        },
      });
      const PEER_ID = "peer id";
      const res = await rpc.removeNode(PEER_ID);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "remove_node",
        params: [PEER_ID],
      });
      expect(res).toBeNull();
    });

    it("ping peers", async () => {
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result: null,
        },
      });
      const res = await rpc.pingPeers();
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "ping_peers",
        params: [],
      });
      expect(res).toBeNull();
    });

    it("get header", async () => {
      const BLOCK_HASH =
        "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4";
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            compact_target: "0x20010000",
            dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
            epoch: "0xa00090000e2",
            hash: "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4",
            nonce: "0x3388940124a1004051e37eb039a3dfeb",
            number: "0x8dd",
            parent_hash:
              "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
            proposals_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            timestamp: "0x172a8804ad1",
            transactions_root:
              "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
            extra_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            version: "0x0",
          },
          id,
        },
      });
      const res = await rpc.getHeader(BLOCK_HASH);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_header",
        params: [BLOCK_HASH],
      });
      expect(res).toEqual({
        compactTarget: "0x20010000",
        dao: "0xd6ec63f77d466d2fb394bcb565ac2300b14e9b080c222a0000418b05be0fff06",
        epoch: "0xa00090000e2",
        hash: "0x7c7f64c875b22807451620c9d1e9af460e851ffe82d85a90e1bccb1117e2e3a4",
        nonce: "0x3388940124a1004051e37eb039a3dfeb",
        number: "0x8dd",
        parentHash:
          "0xc4537bb867ef8103c221888f134b95078bb121c9cb2b654272e6730025304b7b",
        proposalsHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: "0x172a8804ad1",
        transactionsRoot:
          "0xcde937f363e195a97467061a45a6b5b318da02fc3fec5e76ab298e41ace0b7a1",
        extraHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        version: "0x0",
      });
    });

    it("get header by number", async () => {
      const BLOCK_NUMBER = "0x1";
      axiosMock.mockResolvedValue({
        data: {
          jsonrpc: "2.0",
          result: {
            compact_target: "0x20010000",
            dao: "0x1d78d68e4363a12ee3e511f1fa862300f091bde0110f00000053322801fbfe06",
            epoch: "0xa0002000000",
            hash: "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
            nonce: "0x4e51c6b50fd5a1af81c1d0c770a23c93",
            number: BLOCK_NUMBER,
            parent_hash:
              "0x4aa1bf4930b2fbcebf70bd0b6cc63a19ae8554d6c7e89a666433040300641db9",
            proposals_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            timestamp: "0x1725940cb91",
            transactions_root:
              "0xcd95e31e21734fb796de0070407c1d4f91ec00d699f840e5ad9aa293443744e6",
            extra_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            version: "0x0",
          },
          id,
        },
      });
      const res = await rpc.getHeaderByNumber(BLOCK_NUMBER);
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "get_header_by_number",
        params: [BLOCK_NUMBER],
      });
      expect(res).toEqual({
        compactTarget: "0x20010000",
        dao: "0x1d78d68e4363a12ee3e511f1fa862300f091bde0110f00000053322801fbfe06",
        epoch: "0xa0002000000",
        hash: "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
        nonce: "0x4e51c6b50fd5a1af81c1d0c770a23c93",
        number: BLOCK_NUMBER,
        parentHash:
          "0x4aa1bf4930b2fbcebf70bd0b6cc63a19ae8554d6c7e89a666433040300641db9",
        proposalsHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: "0x1725940cb91",
        transactionsRoot:
          "0xcd95e31e21734fb796de0070407c1d4f91ec00d699f840e5ad9aa293443744e6",
        extraHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        version: "0x0",
      });
    });

    it("send transaction", async () => {
      const tx = {
        cellDeps: [
          {
            outPoint: {
              txHash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              index: "0x1",
            },
            depType: "code",
          },
        ],
        headerDeps: [],
        inputs: [
          {
            previousOutput: {
              txHash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              index: "0x0",
            },
            since: "0x0",
          },
        ],
        outputs: [
          {
            capacity: "0x48c27395000",
            lock: {
              args: [],
              codeHash:
                "0x0000000000000000000000000000000000000000000000000000000000000001",
              hashType: "data",
            },
            type: null,
          },
        ],
        version: "0x0",
        outputsData: ["0x"],
        witnesses: [],
      };
      axiosMock.mockResolvedValue({
        data: {
          id,
          jsonrpc: "2.0",
          result:
            "0xa0ef4eb5f4ceeb08a4c8524d84c5da95dce2f608e0ca2ec8091191b0f330c6e3",
        },
      });
      const res = await rpc.sendTransaction(tx, "passthrough");
      expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
        id,
        jsonrpc: "2.0",
        method: "send_transaction",

        params: [
          {
            cell_deps: [
              {
                out_point: {
                  tx_hash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                  index: "0x1",
                },
                dep_type: "code",
              },
            ],
            header_deps: [],
            inputs: [
              {
                previous_output: {
                  tx_hash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                  index: "0x0",
                },
                since: "0x0",
              },
            ],
            outputs: [
              {
                capacity: "0x48c27395000",
                lock: {
                  args: [],
                  code_hash:
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                  hash_type: "data",
                },
                type: null,
              },
            ],
            version: "0x0",
            outputs_data: ["0x"],
            witnesses: [],
          },
          "passthrough",
        ],
      });
      expect(res).toEqual(
        "0xa0ef4eb5f4ceeb08a4c8524d84c5da95dce2f608e0ca2ec8091191b0f330c6e3"
      );
    });

    it.each([
      {
        methodName: "getBlockFilter",
        result: {
          data: "0x0000",
          hash: "0x0000",
        },
        resultFormatter: ResultFormatter.toBlockFilter,
        requestParams: [
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
        expectedParams: {
          method: "get_block_filter",
          params: [
            "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          ],
        },
      },
      {
        methodName: "getBlockFilter",
        result: null,
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toBlockFilter
        ),
        requestParams: [
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
        expectedParams: {
          method: "get_block_filter",
          params: [
            "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          ],
        },
      },
      {
        methodName: "getTransactionAndWitnessProof",
        result: {
          block_hash:
            "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed",
          transactions_proof: {
            indices: ["0x0"],
            lemmas: [],
          },
          witnesses_proof: {
            indices: ["0x0"],
            lemmas: [],
          },
        },
        resultFormatter: ResultFormatter.toTransactionAndWitnessProof,
        requestParams: [
          [
            "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
          ],
          "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
        ],

        expectedParams: {
          method: "get_transaction_and_witness_proof",
          params: [
            [
              "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
            ],
            "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
          ],
        },
      },

      {
        methodName: "verifyTransactionAndWitnessProof",
        result: [
          "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
        ],
        resultFormatter: ResultFormatter.toArray(ResultFormatter.toHash),
        requestParams: [
          {
            blockHash:
              "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed",
            transactionsProof: {
              indices: ["0x0"],
              lemmas: [],
            },
            witnessesProof: {
              indices: ["0x0"],
              lemmas: [],
            },
          },
        ],

        expectedParams: {
          method: "verify_transaction_and_witness_proof",
          params: [
            {
              block_hash:
                "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed",
              transactions_proof: {
                indices: ["0x0"],
                lemmas: [],
              },
              witnesses_proof: {
                indices: ["0x0"],
                lemmas: [],
              },
            },
          ],
        },
      },
      {
        methodName: "getForkBlock",
        result: {
          header: {
            compact_target: "0x1e083126",
            dao: "0xb5a3e047474401001bc476b9ee573000c0c387962a38000000febffacf030000",
            epoch: "0x7080018000001",
            extra_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            hash: "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
            nonce: "0x0",
            number: "0x400",
            parent_hash:
              "0xae003585fa15309b30b31aed3dcf385e9472c3c3e93746a6c4540629a6a1ed2d",
            proposals_hash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            timestamp: "0x5cd2b118",
            transactions_root:
              "0xc47d5b78b3c4c4c853e2a32810818940d0ee403423bea9ec7b8e566d9595206c",
            version: "0x0",
          },
          proposals: [],
          transactions: [
            {
              cell_deps: [],
              hash: "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17",
              header_deps: [],
              inputs: [
                {
                  previous_output: {
                    index: "0xffffffff",
                    tx_hash:
                      "0x0000000000000000000000000000000000000000000000000000000000000000",
                  },
                  since: "0x400",
                },
              ],
              outputs: [
                {
                  capacity: "0x18e64b61cf",
                  lock: {
                    code_hash:
                      "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                    hash_type: "data",
                    args: "0x",
                  },
                  type: null,
                },
              ],
              outputs_data: ["0x"],
              version: "0x0",
              witnesses: [
                "0x450000000c000000410000003500000010000000300000003100000028e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5000000000000000000",
              ],
            },
          ],
          uncles: [],
        },

        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toForkBlockResult
        ),
        requestParams: [
          "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
        ],
        expectedParams: {
          method: "get_fork_block",
          params: [
            "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
          ],
        },
      },
      {
        methodName: "getForkBlock",
        result:
          "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toForkBlockResult
        ),
        requestParams: [
          "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
          0n,
        ],
        expectedParams: {
          method: "get_fork_block",
          params: [
            "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
            "0x0",
          ],
        },
      },
      {
        methodName: "getForkBlock",
        result: null,
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toForkBlockResult
        ),
        requestParams: [
          "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
        ],
        expectedParams: {
          method: "get_fork_block",
          params: [
            "0xdca341a42890536551f99357612cef7148ed471e3b6419d0844a4e400be6ee94",
          ],
        },
      },
      {
        methodName: "getBlockMedianTime",
        result: "0x5cd2b105",
        resultFormatter: ResultFormatter.toNullable(ResultFormatter.toNumber),
        requestParams: [
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
        expectedParams: {
          method: "get_block_median_time",
          params: [
            "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          ],
        },
      },
      {
        methodName: "getBlockMedianTime",
        result: null,
        resultFormatter: ResultFormatter.toNullable(ResultFormatter.toNumber),
        requestParams: [
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
        expectedParams: {
          method: "get_block_median_time",
          params: [
            "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          ],
        },
      },
      {
        methodName: "getBlockMedianTime",
        result: null,
        resultFormatter: ResultFormatter.toNullable(ResultFormatter.toNumber),
        requestParams: [
          "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
        ],
        expectedParams: {
          method: "get_block_median_time",
          params: [
            "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
          ],
        },
      },
      {
        methodName: "estimateCycles",
        result: {
          cycles: "0x219",
        },
        resultFormatter: ResultFormatter.toEstimateCycles,
        requestParams: [
          ResultFormatter.toTransaction({
            cell_deps: [
              {
                dep_type: "code",
                out_point: {
                  index: "0x0",
                  tx_hash:
                    "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
                },
              },
            ],
            header_deps: [
              "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed",
            ],
            inputs: [
              {
                previous_output: {
                  index: "0x0",
                  tx_hash:
                    "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17",
                },
                since: "0x0",
              },
            ],
            outputs: [
              {
                capacity: "0x2540be400",
                lock: {
                  code_hash:
                    "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                  hash_type: "data",
                  args: "0x",
                },
                type: null,
              },
            ],
            outputs_data: ["0x"],
            version: "0x0",
            witnesses: [],
          }),
        ],
        expectedParams: {
          method: "estimate_cycles",
          params: [
            {
              cell_deps: [
                {
                  dep_type: "code",
                  out_point: {
                    index: "0x0",
                    tx_hash:
                      "0xa4037a893eb48e18ed4ef61034ce26eba9c585f15c9cee102ae58505565eccc3",
                  },
                },
              ],
              header_deps: [
                "0x7978ec7ce5b507cfb52e149e36b1a23f6062ed150503c85bbf825da3599095ed",
              ],
              inputs: [
                {
                  previous_output: {
                    index: "0x0",
                    tx_hash:
                      "0x365698b50ca0da75dca2c87f9e7b563811d3b5813736b8cc62cc3b106faceb17",
                  },
                  since: "0x0",
                },
              ],
              outputs: [
                {
                  capacity: "0x2540be400",
                  lock: {
                    code_hash:
                      "0x28e83a1277d48add8e72fadaa9248559e1b632bab2bd60b27955ebc4c03800a5",
                    hash_type: "data",
                    args: "0x",
                  },
                  type: null,
                },
              ],
              outputs_data: ["0x"],
              version: "0x0",
              witnesses: [],
            },
          ],
        },
      },
      {
        methodName: "getFeeRateStatistics",
        result: {
          mean: "0xe79d",
          median: "0x14a8",
        },
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toFeeRateStatistics
        ),
        requestParams: [],
        expectedParams: {
          method: "get_fee_rate_statistics",
          params: [],
        },
      },
      {
        methodName: "getFeeRateStatistics",
        result: null,
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toFeeRateStatistics
        ),
        requestParams: [],
        expectedParams: {
          method: "get_fee_rate_statistics",
          params: [],
        },
      },
      {
        methodName: "getFeeRateStatics",
        result: {
          mean: "0xe79d",
          median: "0x14a8",
        },
        resultFormatter: ResultFormatter.toFeeRateStatistics,
        requestParams: [],
        expectedParams: {
          method: "get_fee_rate_statics",
          params: [],
        },
      },
      {
        methodName: "getFeeRateStatics",
        result: null,
        resultFormatter: ResultFormatter.toNullable(
          ResultFormatter.toFeeRateStatistics
        ),
        requestParams: [],
        expectedParams: {
          method: "get_fee_rate_statics",
          params: [],
        },
      },
    ])(
      "$methodName",
      async ({
        methodName,
        result,
        resultFormatter,
        requestParams,
        expectedParams,
      }) => {
        axiosMock.mockResolvedValue({
          data: {
            id,
            jsonrpc: "2.0",
            result,
          },
        });
        const res = await rpc[methodName](...requestParams);

        expect(res).toEqual(resultFormatter(result));
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
          id,
          jsonrpc: "2.0",
          ...expectedParams,
        });
      }
    );

    describe("batch request", () => {
      const batch = rpc.createBatchRequest([
        [
          "getBlock",
          "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
        ],
      ]);

      it("batch request can be created with empty parameters", () => {
        const emptyBatch = rpc.createBatchRequest();
        expect(emptyBatch).toHaveLength(0);
      });

      it("should has init request", () => {
        expect(batch).toEqual([
          [
            "getBlock",
            "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
          ],
        ]);
      });

      it("should add a new request", () => {
        batch.add("getTipHeader");
        expect(batch).toEqual([
          [
            "getBlock",
            "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
          ],
          ["getTipHeader"],
        ]);
      });

      it("should remove a request", () => {
        batch.add("localNodeInfo");
        expect(batch).toEqual([
          [
            "getBlock",
            "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
          ],
          ["getTipHeader"],
          ["localNodeInfo"],
        ]);
        batch.remove(1);
        expect(batch).toEqual([
          [
            "getBlock",
            "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
          ],
          ["localNodeInfo"],
        ]);
      });

      it("should accept params in list", () => {
        const multiParamBatch = rpc.createBatchRequest([
          ["setBan", "address", "insert", null, true, "mock request"],
          ["getPeers"],
        ]);
        expect(multiParamBatch).toEqual([
          ["setBan", "address", "insert", null, true, "mock request"],
          ["getPeers"],
        ]);
        multiParamBatch.add("setBan", "address", "delete");
        expect(multiParamBatch).toEqual([
          ["setBan", "address", "insert", null, true, "mock request"],
          ["getPeers"],
          ["setBan", "address", "delete"],
        ]);
      });

      it("should parse request and response correctly", async () => {
        axiosMock.mockResolvedValue({
          data: [
            {
              jsonrpc: "2.0",
              result: {
                header: {
                  compact_target: "0x20010000",
                  dao: "0x1d78d68e4363a12ee3e511f1fa862300f091bde0110f00000053322801fbfe06",
                  epoch: "0xa0002000000",
                  hash: "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
                  nonce: "0x4e51c6b50fd5a1af81c1d0c770a23c93",
                  number: "0x2",
                  parent_hash:
                    "0x4aa1bf4930b2fbcebf70bd0b6cc63a19ae8554d6c7e89a666433040300641db9",
                  proposals_hash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                  timestamp: "0x1725940cb91",
                  transactions_root:
                    "0xcd95e31e21734fb796de0070407c1d4f91ec00d699f840e5ad9aa293443744e6",
                  extra_hash:
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                  version: "0x0",
                },
                proposals: [],
                transactions: [
                  {
                    cell_deps: [],
                    hash: "0xdb9e84bc7bf583f0d0f2dcd82a41229bf52cfa45edbedfb7a4d0d3120b8e4066",
                    header_deps: [],
                    inputs: [
                      {
                        previous_output: {
                          index: "0xffffffff",
                          tx_hash:
                            "0x0000000000000000000000000000000000000000000000000000000000000000",
                        },
                        since: "0x2",
                      },
                    ],
                    outputs: [],
                    outputs_data: [],
                    version: "0x0",
                    witnesses: [
                      "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
                    ],
                  },
                ],
                uncles: [],
              },
              id,
            },
            {
              jsonrpc: "2.0",
              result: {
                active: true,
                addresses: [
                  {
                    address:
                      "/ip4/192.168.0.2/tcp/8112/p2p/QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
                    score: "0xff",
                  },
                ],
                connections: "0xb",
                node_id: "QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
                protocols: [
                  {
                    id: "0x0",
                    name: "/ckb/ping",
                    support_versions: ["0.0.1"],
                  },
                ],
                version: "0.34.0 (f37f598 2020-07-17)",
              },
              id,
            },
          ],
        });
        const res = await batch.exec();
        expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual([
          {
            id,
            jsonrpc: "2.0",
            method: "get_block",
            params: [
              "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
            ],
          },
          { id, jsonrpc: "2.0", method: "local_node_info", params: [] },
        ]);
        expect(res).toEqual([
          {
            header: {
              compactTarget: "0x20010000",
              dao: "0x1d78d68e4363a12ee3e511f1fa862300f091bde0110f00000053322801fbfe06",
              epoch: "0xa0002000000",
              hash: "0xffd50ddb91a842234ff8f0871b941a739928c2f4a6b5cfc39de96a3f87c2413e",
              nonce: "0x4e51c6b50fd5a1af81c1d0c770a23c93",
              number: "0x2",
              parentHash:
                "0x4aa1bf4930b2fbcebf70bd0b6cc63a19ae8554d6c7e89a666433040300641db9",
              proposalsHash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              timestamp: "0x1725940cb91",
              transactionsRoot:
                "0xcd95e31e21734fb796de0070407c1d4f91ec00d699f840e5ad9aa293443744e6",
              extraHash:
                "0x0000000000000000000000000000000000000000000000000000000000000000",
              version: "0x0",
            },
            proposals: [],
            transactions: [
              {
                cellDeps: [],
                hash: "0xdb9e84bc7bf583f0d0f2dcd82a41229bf52cfa45edbedfb7a4d0d3120b8e4066",
                headerDeps: [],
                inputs: [
                  {
                    previousOutput: {
                      index: "0xffffffff",
                      txHash:
                        "0x0000000000000000000000000000000000000000000000000000000000000000",
                    },
                    since: "0x2",
                  },
                ],
                outputs: [],
                outputsData: [],
                version: "0x0",
                witnesses: [
                  "0x5a0000000c00000055000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000e2fa82e70b062c8644b80ad7ecf6e015e5f352f60100000000",
                ],
              },
            ],
            uncles: [],
          },
          {
            active: true,
            addresses: [
              {
                address:
                  "/ip4/192.168.0.2/tcp/8112/p2p/QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
                score: "0xff",
              },
            ],
            connections: "0xb",
            nodeId: "QmTRHCdrRtgUzYLNCin69zEvPvLYdxUZLLfLYyHVY3DZAS",
            protocols: [
              {
                id: "0x0",
                name: "/ckb/ping",
                supportVersions: ["0.0.1"],
              },
            ],
            version: "0.34.0 (f37f598 2020-07-17)",
          },
        ]);
      });
    });
  });

  describe("ckb-rpc errors", () => {
    it("throw raw error", async () => {
      expect.assertions(1);
      try {
        await rpc.getBlock(0);
      } catch (err) {
        expect(err.message).toEqual("Expect hash to be string, but 0 received");
      }
    });

    describe("batch request", () => {
      it("should throw method not found error", () => {
        expect.assertions(1);
        try {
          rpc.createBatchRequest([["Unknown", []]]);
        } catch (err) {
          expect(err.message).toEqual(
            "[Batch Request]: Method Unknown is not found"
          );
        }
      });

      describe("should throw errors with index", () => {
        it("should throw an error of validation", () => {
          expect.assertions(1);
          const batch = rpc.createBatchRequest([["getBlock", [0]]]);
          batch
            .exec()
            .catch((err) =>
              expect(err).toEqual(
                new Error(
                  `[Batch Request 0]: Expect hash to be string, but 0 received`
                )
              )
            );
        });

        it("should return an error of mismatched json rpc id", async () => {
          expect.assertions(1);
          const batch = rpc.createBatchRequest([["localNodeInfo"]]);
          axiosMock.mockResolvedValue({
            data: [
              {
                id: id + 1,
                jsonrpc: "2.0",
                result: {
                  addresses: [
                    {
                      address:
                        "/ip4/0.0.0.0/tcp/8115/p2p/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                      score: "0x1",
                    },
                  ],
                  is_outbound: null,
                  node_id: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                  version: "0.32.0 (248aa88 2020-05-22)",
                },
              },
            ],
          });
          const res = await batch.exec();
          expect(res[0]).toEqual(
            new Error(
              `[Batch Request 0]: Expect json rpc id to be 10000, but 10001 received`
            )
          );
        });
      });
    });
  });
});
