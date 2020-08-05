import { Cell, Header } from "@ckb-lumos/base";

export const bobSecpInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const bobMultisigInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hash_type: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x74c3264f67663ba244c35453c3b3c790e6ae6dbf24eba5809494d6bf4d9cd89d",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const bobMultisigLockInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hash_type: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x765c43a94a38d758dd74ffd3671399da62c1ddeac705a8ca47657970a5be7a13",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const bobSudtInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        code_hash:
          "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
        hash_type: "data",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    out_point: {
      tx_hash:
        "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const bobAcpCells: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0xcd56140e689205eeda3a0b853abf985f7cc405df758091601783844c18153527",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const aliceAcpCells: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
        hash_type: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x0a2955b8ac416a660bff138a8d33d1722086e264c5cdf5a33fea07e9613ec860",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

export const tipHeader: Header = {
  compact_target: "0x1d4543f7",
  dao: "0x85f96976f65bbf2fc56358de57bb2300a51874a76a153b000068217d4ec10507",
  epoch: "0x28d00ae00013e",
  hash: "0x2a68f7a4162a80c2b9cea95cf8b0d2ff43de80eec0fb37c78a9650271053ba24",
  nonce: "0xf37f9e024d995f35443443be1169f4f9",
  number: "0x36281",
  parent_hash:
    "0x4b714a2d708e49a2ccc27088861b85038525afe06fc69ba9961af272ed94e3ff",
  proposals_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x1734b70be18",
  transactions_root:
    "0x3aa8da1d229a6fb5d85ae5d71c6db4f6de9eefab288f2d635a79d0f2a610bc67",
  uncles_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};
