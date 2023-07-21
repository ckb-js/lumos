import { execSync } from "node:child_process";
import { DeepRequired } from "../types";
import { stringify } from "../utils";
import { replaceContentSync } from "@ckb-lumos/utils";
import { join } from "node:path";
import { parse as parseToml, stringify as stringifyToml } from "@ltd/j-toml";

/**
 * The first dev chain's issued lock
 * @see {@link https://github.com/nervosnetwork/ckb/blob/f1c9c7b1adc40b9a7e5f8be79f80751c3a310a01/resource/specs/dev.toml#L76}
 */
const DEFAULT_BA_ARG = "0xc8328aabcd9b9e8e64fbc566c4385c3bdeb219d7";

interface NodeOptions {
  chain?: "mainnet" | "testnet" | "dev";
  importSpec?: string;
  dataDir?: string;
  rpcPort?: number;
  p2pPort?: number;
  baArg?: string;
  force?: boolean;
}

type NodeConfig = DeepRequired<NodeOptions>;

function parseToCommandArgs(options?: NodeOptions): {
  args: string[];
  config: NodeConfig;
} {
  const config: NodeConfig = {
    chain: options?.chain ?? "dev",
    dataDir: options?.dataDir ?? "data",
    importSpec: options?.importSpec ?? "",
    rpcPort: options?.rpcPort ?? 8114,
    p2pPort: options?.p2pPort ?? 8115,

    baArg: options?.baArg ?? DEFAULT_BA_ARG,
    force: options?.force ?? false,
  };

  const args = [
    "init",
    ["--chain", config.chain],
    config.importSpec ? ["--import-spec", config.importSpec] : [],
    ["--rpc-port", stringify(config.rpcPort)],
    ["--p2p-port", stringify(config.p2pPort)],
    config.baArg
      ? [
          "--ba-arg",
          config.baArg,
          "--ba-code-hash",
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          "--ba-hash-type",
          "type",
        ]
      : [],
    config.force ? ["--force"] : [],
  ].flat();

  return { args, config };
}

interface GenerateConfigOptions extends NodeOptions {
  /**
   * The current working directory in which the config file will be generated
   */
  cwd?: string;
}

export function generateConfigSync(
  binaryPath: string,
  options?: GenerateConfigOptions
): void {
  const cwd = options?.cwd ?? process.cwd();
  const cmd = parseToCommandArgs(options);

  execSync(`${binaryPath} ${cmd.args.join(" ")}`, { cwd });

  replaceContentSync(join(cwd, "ckb-miner.toml"), (source) => {
    // TODO add typescript description here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ckbMinerToml: Record<string, any> = parseToml(source);
    ckbMinerToml.miner.workers[0].value = 500n;
    ckbMinerToml.miner.client.rpc_url = `http://127.0.0.1:${cmd.config.rpcPort}`;

    return stringifyToml(ckbMinerToml, { newline: "\n" });
  });

  replaceContentSync(join(cwd, "ckb.toml"), (source) => {
    // TODO add typescript description here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ckbToml: Record<string, any> = parseToml(source);
    ckbToml.rpc.modules = [
      "Net",
      "Pool",
      "Miner",
      "Chain",
      "Stats",
      "Subscription",
      "Experiment",
      "Debug",
      "Indexer",
    ];
    return stringifyToml(ckbToml, { newline: "\n" });
  });
}
