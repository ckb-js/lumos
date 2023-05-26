import { spawn, execSync } from "node:child_process";
import { join } from "node:path";
import { waitFor } from "./async";
import { RPC } from "@ckb-lumos/rpc";
import { RPC as IndexerRpc } from "../src";

const MODULE_PATH = join(__dirname, "..");

function pathTo(subPath: string): string {
  return join(MODULE_PATH, subPath);
}

async function main() {
  const ckbRpc = new RPC("http://localhost:8118/rpc");
  const indexerRpc = new IndexerRpc("http://127.0.0.1:8120");

  // launch mock CKB node
  const ckbProcess = spawn(
    `npx`,
    ["ts-node", pathTo("tests/start_mock_rpc.ts")],
    {
      stdio: "inherit",
    }
  );

  await waitFor(() => ckbRpc.getTipBlockNumber(), {
    timeoutMs: 5000,
    name: "Launch mock CKB node",
  });

  // launch CKB Indexer
  const indexerProcess = spawn(
    `npx`,
    ["ts-node", pathTo("tests/start_ckb_indexer")],
    {
      stdio: "inherit",
    }
  );
  await waitFor(() => indexerRpc.getTip(), {
    name: "Launch CKB Indexer",
    timeoutMs: 10000,
  });

  execSync("ava '**/*.e2e.test.ts' --timeout=2m", {
    cwd: pathTo("/"),
    stdio: "inherit",
  });

  ckbProcess.kill();
  indexerProcess.kill();
}

main();
