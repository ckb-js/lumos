import { JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import express, { Express } from "express";
import bodyParser from "body-parser";
import { blockchain, LocalNode, utils } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { RPC } from "@ckb-lumos/rpc/types/rpc";
import TransactionStatus = RPC.TransactionStatus;

interface Options {
  // FIXME it actually is RPCBlock
  blocks: RPC.Block[];
  localNode: LocalNode;
  // defaults to /rpc
  routePath?: string;
}

function assertsParams(param: unknown): asserts param {
  if (!param) throw new Error("Invalid params");
}

export function createCKBMockRPC(options: Options): Express {
  const { routePath = "/rpc", blocks, localNode } = options;

  const server = new JSONRPCServer();
  server.addMethod("local_node_info", () => ({
    version: localNode.version,
    active: localNode.active,
    addresses: localNode.addresses,
    connections: localNode.connections,
    node_id: localNode.nodeId,
    protocols: localNode.protocols.map((item) => ({
      id: item.id,
      name: item.name,
      support_versions: item.supportVersions,
    })),
  }));
  server.addMethod("get_block_by_number", (params) => {
    assertsParams(Array.isArray(params));

    const blockNumber = params[0];
    const verbosity = params[1] || "0x2";
    assertsParams(
      typeof blockNumber === "string" && !isNaN(Number(blockNumber))
    );

    const block = blocks.find(
      (block) => Number(block.header.number) === Number(blockNumber)
    );
    if (!block) return null;

    if (Number(verbosity) === 0) {
      const formattedBlock = utils.deepCamelizeTransaction(block);
      const packedBlock = blockchain.Block.pack(formattedBlock);
      return bytes.hexify(packedBlock);
    }

    return block;
  });

  server.addMethod("get_block_hash", (blockNumbers) => {
    assertsParams(Array.isArray(blockNumbers));
    const blockNumber = blockNumbers[0];
    assertsParams(
      typeof blockNumber === "string" && !isNaN(Number(blockNumber))
    );

    const block = blocks.find(
      (block) => Number(block.header.number) === Number(blockNumber)
    );
    if (!block) return null;

    return block.header.hash;
  });

  server.addMethod("get_tip_block_number", () => {
    if (blocks.length < 1) {
      return null;
    }
    return blocks[blocks.length - 1].header.number;
  });

  server.addMethod(
    "get_transaction",
    (hashes): RPC.TransactionWithStatus | null => {
      assertsParams(Array.isArray(hashes));
      const hash = hashes[0];
      let result: RPC.Transaction | undefined = undefined;
      let blockHash: string | undefined = undefined;
      for (const block of blocks) {
        block.transactions;
        const tx = block.transactions.find((tx) => tx.hash === hash);
        if (tx) {
          result = tx;
          blockHash = block.header.hash;
          break;
        }
      }
      if (!result || !blockHash) return null;

      return {
        transaction: result,
        tx_status: {
          status: TransactionStatus.Committed,
          block_hash: blockHash,
        },
        time_added_to_pool: null,
        cycles: null,
      };
    }
  );

  server.addMethod("get_blockchain_info", () => {
    return {
      alerts: [],
      chain: "ckb_testnet",
      difficulty: "0x1b6f506b",
      epoch: "0x708069a000cc5",
      is_initial_block_download: false,
      median_time: "0x17d3723d27d",
    };
  });

  const app = express();
  app.use(bodyParser.json());

  app.post(routePath, (req, res) => {
    const jsonRPCRequest = req.body;
    if (Array.isArray(jsonRPCRequest)) {
      const responseList: (JSONRPCResponse | null)[] = [];
      jsonRPCRequest.forEach((request) => {
        server.receive(request).then((response) => {
          responseList.push(response);
          if (responseList.length === jsonRPCRequest.length) {
            res.json(responseList);
          }
        });
      });
    } else {
      server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
        if (jsonRPCResponse) {
          res.json(jsonRPCResponse);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });

  return app;
}
