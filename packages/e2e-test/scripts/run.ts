import { spawn, execSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync } from "node:fs";
import { retry } from "@ckb-lumos/utils";
import { RPC } from "@ckb-lumos/rpc";
import { LightClientRPC } from "@ckb-lumos/light-client";
import killPort from "kill-port";
import {
  ckb,
  download,
  getDefaultDownloadDestination,
  lightClient,
} from "@ckb-lumos/runner";
import {
  CKB_RPC_PORT,
  CKB_RPC_URL,
  LIGHT_CLIENT_RPC_PORT,
  LIGHT_CLIENT_RPC_URL,
} from "../src/constants";

const MODULE_PATH = join(__dirname, "..");
const CKB_CWD = pathTo("tmp/ckb");
const LIGHT_CLIENT_CWD = pathTo("tmp/light-client");

function pathTo(subPath: string): string {
  return join(MODULE_PATH, subPath);
}

async function main() {
  await killPort(CKB_RPC_PORT).catch(() => {});
  await killPort(LIGHT_CLIENT_RPC_PORT).catch(() => {});
  await killPort(8118).catch(() => {});

  rmSync(CKB_CWD, { recursive: true, force: true });
  rmSync(LIGHT_CLIENT_CWD, { recursive: true, force: true });
  mkdirSync(CKB_CWD, { recursive: true });
  mkdirSync(LIGHT_CLIENT_CWD, { recursive: true });

  const ckbReleaseUrl = ckb.getReleaseUrl();
  const ckbDownloadDest = getDefaultDownloadDestination(ckbReleaseUrl);
  let ckbBinaryPath = ckb.findBinaryPath(ckbDownloadDest);

  if (!ckbBinaryPath) {
    await download(ckbReleaseUrl, ckbDownloadDest);
    ckbBinaryPath = ckb.findBinaryPath(ckbDownloadDest);
    if (!ckbBinaryPath) {
      throw new Error("CKB binary not found");
    }
  }

  ckb.generateConfigSync(ckbBinaryPath, {
    rpcPort: CKB_RPC_PORT,
    cwd: CKB_CWD,
  });

  const ckbProcess = spawn(ckbBinaryPath, ["run", "--indexer"], {
    cwd: CKB_CWD,
  });
  const ckbMinerProcess = spawn(ckbBinaryPath, ["miner"], {
    cwd: CKB_CWD,
  });

  const ckbRpc = new RPC(CKB_RPC_URL);
  const tipBlock = await retry(
    () =>
      ckbRpc.getTipBlockNumber().then((res) => {
        if (Number(res) <= 0) return Promise.reject();
        return res;
      }),
    {
      timeout: 30_000,
      delay: 100,
      retries: 100,
    }
  );

  console.info("CKB started", tipBlock);

  const lightClientReleaseUrl = lightClient.getReleaseUrl();
  const lightClientDownloadDest = getDefaultDownloadDestination(
    lightClientReleaseUrl
  );
  let lightClientBinaryPath = lightClient.findBinaryPath(
    lightClientDownloadDest
  );

  if (!lightClientBinaryPath) {
    await download(lightClientReleaseUrl, lightClientDownloadDest);
    lightClientBinaryPath = lightClient.findBinaryPath(lightClientDownloadDest);
    if (!lightClientBinaryPath) {
      throw new Error("Light client binary not found");
    }
  }

  const nodeInfo = await ckbRpc.localNodeInfo();
  const bootnode = join(nodeInfo.addresses[0].address, "p2p", nodeInfo.nodeId);
  lightClient.generateConfigSync({
    lightClientConfig: {
      chain: join(CKB_CWD, "specs/dev.toml"),
      network: { bootnodes: [bootnode] },
    },
    cwd: LIGHT_CLIENT_CWD,
  });

  const lightClientProcess = spawn(
    lightClientBinaryPath,
    ["run", "--config-file", join(LIGHT_CLIENT_CWD, "light-client.toml")],
    {
      stdio: "inherit",
      cwd: LIGHT_CLIENT_CWD,
      env: {
        RUST_LOG: "info",
        ckb_light_client: "info",
      },
    }
  );

  const lightClientRpc = new LightClientRPC(LIGHT_CLIENT_RPC_URL);
  const lightClientTip = await retry(() => lightClientRpc.getTipHeader(), {
    retries: 30,
    timeout: 30_000,
    delay: 100,
  });

  console.info("Light Client started, tip header:", lightClientTip);

  execSync("npx ava '**/*.e2e.test.ts' --verbose --timeout=5m", {
    cwd: pathTo("/"),
    stdio: "inherit",
  });

  lightClientProcess.kill();
  ckbMinerProcess.kill();
  ckbProcess.kill();

  process.exit();
}

main();
