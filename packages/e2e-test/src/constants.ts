export const CKB_HOST = `127.0.0.1`;
export const CKB_RPC_PORT = 8114;
export const CKB_P2P_PORT = 8115;

export const LIGHT_CLIENT_HOST = `127.0.0.1`;
export const LIGHT_CLIENT_RPC_PORT = 9000;

export const CKB_RPC_URL = `http://${CKB_HOST}:${CKB_RPC_PORT}`;
export const LIGHT_CLIENT_RPC_URL = `http://${LIGHT_CLIENT_HOST}:${LIGHT_CLIENT_RPC_PORT}`;

// from docker/ckb/dev.toml [[genesis.system_cells]]
export const GENESIS_CELL_PRIVATEKEYS = [
  "0xd00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc",
  "0x63d86723e08f0f813a36ce6aa123bb2289d90680ae1e99d4de8cdb334553f24d",
];
