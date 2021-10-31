import { JSONRPCServer } from "json-rpc-2.0";
import express, { Express } from "express";
import bodyParser from "body-parser";
import { LocalNode, Block, core } from "@ckb-lumos/base";
import { normalizers, Reader } from "ckb-js-toolkit";

interface Options {
  blocks: Block[];
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

  server.addMethod("local_node_info", () => localNode);
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

    if (Number(verbosity) === 0)
      return new Reader(
        core.SerializeBlock(normalizers.NormalizeBlock(block))
      ).serializeJson();
    return block;
  });

  server.addMethod("get_tip_block_number", () => {
    const lastBlock = blocks[blocks.length -1].header.number;
    return `0x63-${lastBlock}`
  })

  const app = express();
  app.use(bodyParser.json());

  app.post(routePath, (req, res) => {
    const jsonRPCRequest = req.body;
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse) {
        res.json(jsonRPCResponse);
      } else {
        res.sendStatus(204);
      }
    });
  });

  return app;
}
