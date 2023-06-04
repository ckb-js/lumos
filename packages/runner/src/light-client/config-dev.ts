import { stringify } from "../utils";
import { DeepRequired } from "../types";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface LightClientConfig {
  chain: string;
  store?: {
    /**
     * @default "data/network"
     * @example "data/store"
     */
    path?: string;
  };
  network: {
    /**
     * @default "data/network"
     * @example "data/network"
     */
    path?: string;
    /**
     * @default ["/ip4/0.0.0.0/tcp/8118"]
     * @example ["/ip4/0.0.0.0/tcp/8118"]
     */
    listenAddresses?: string[];
    /**
     * @example ["/ip4/47.111.169.36/tcp/8111/p2p/QmNQ4jky6uVqLDrPU7snqxARuNGWNLgSrTnssbRuy3ij2W"]
     */
    bootnodes: string[];

    /**
     * @default 1
     */
    maxOutboundPeers?: number;
  };
  rpc?: {
    /**
     * @default "127.0.0.1:9000"
     * @example "127.0.0.1:9000"
     */
    listenAddress?: string;
  };
}

export interface Options {
  lightClientConfig: LightClientConfig;

  cwd?: string;
  filename?: string;
}

/**
 * Create a Light Client config file in toml format string
 * @param options
 */
export function generateConfigSync(options: Options): DeepRequired<Options> {
  const lightClientConfig = options.lightClientConfig;

  const config: DeepRequired<Options> = {
    lightClientConfig: {
      chain: lightClientConfig.chain,
      store: { path: lightClientConfig.store?.path ?? "data/store" },
      network: {
        path: lightClientConfig.network?.path ?? "data/network",
        listenAddresses: lightClientConfig.network?.listenAddresses ?? [
          "/ip4/0.0.0.0/tcp/8118",
        ],
        bootnodes: lightClientConfig.network.bootnodes,
        maxOutboundPeers: lightClientConfig.network.maxOutboundPeers ?? 1,
      },
      rpc: {
        listenAddress: lightClientConfig.rpc?.listenAddress ?? "127.0.0.1:9000",
      },
    },

    cwd: options.cwd ?? process.cwd(),
    filename: options.filename ?? "light-client.toml",
  };

  const toml = `
# chain = "mainnet"
# chain = "testnet"
# chain = "your_path_to/dev.toml"
chain = ${stringify(config.lightClientConfig.chain)}

[store]
path = ${stringify(config.lightClientConfig.store.path || "data/store")}

[network]
path = ${stringify(config.lightClientConfig.network.path)}

listen_addresses = ${stringify(
    config.lightClientConfig.network.listenAddresses
  )}
### Specify the public and routable network addresses
# public_addresses = []

# Node connects to nodes listed here to discovery other peers when there's no local stored peers.
# When chain.spec is changed, this usually should also be changed to the bootnodes in the new chain.
bootnodes = ${stringify(config.lightClientConfig.network.bootnodes)}

### Whitelist-only mode
# whitelist_only = false
### Whitelist peers connecting from the given IP addresses
# whitelist_peers = []

### Enable \`SO_REUSEPORT\` feature to reuse port on Linux, not supported on other OS yet
# reuse_port_on_linux = true

max_peers = 125
max_outbound_peers = ${stringify(
    config.lightClientConfig.network.maxOutboundPeers
  )}
# 2 minutes
ping_interval_secs = 120
# 20 minutes
ping_timeout_secs = 1200
connect_outbound_interval_secs = 15
# If set to true, try to register upnp
upnp = false
# If set to true, network service will add discovered local address to peer store, it's helpful for private net development
discovery_local_address = false
# If set to true, random cleanup when there are too many inbound nodes
# Ensure that itself can continue to serve as a bootnode node
bootnode_mode = false

[rpc]
# Light client rpc is designed for self hosting, exposing to public network is not recommended and may cause security issues.
# By default RPC only binds to localhost, thus it only allows accessing from the same machine.
listen_address = ${stringify(config.lightClientConfig.rpc.listenAddress)}
`;

  const { cwd: configDir, filename: configFileName } = config;

  if (configDir && !existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(join(configDir, configFileName), toml);
  return config;
}
