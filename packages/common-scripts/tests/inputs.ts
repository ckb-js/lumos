import { Cell, Header } from "@ckb-lumos/base";
import { LocktimeCell } from "../src";

export const charlesOmnilockInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x1bf147d1c95a5ad51016bd426c33f364257e685af54df26fc69ec40e3ae267d1",
        hashType: "data",
        args: "0x00e3e0a82b199dceadb55e223c6e4b8e511d57d24900",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x1bf147d1c95a5ad51016bd426c33f364257e685af54df26fc69ec40e3ae267d1",
        hashType: "data",
        args: "0x00e3e0a82b199dceadb55e223c6e4b8e511d57d24900",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x1",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];
export const bobSecpInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x1",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobMultisigInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x74c3264f67663ba244c35453c3b3c790e6ae6dbf24eba5809494d6bf4d9cd89d",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x74c3264f67663ba244c35453c3b3c790e6ae6dbf24eba5809494d6bf4d9cd89d",
      index: "0x1",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobMultisigLockInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x765c43a94a38d758dd74ffd3671399da62c1ddeac705a8ca47657970a5be7a13",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobAcpCells: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0xcd56140e689205eeda3a0b853abf985f7cc405df758091601783844c18153527",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const aliceAcpCells: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
        hashType: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x0a2955b8ac416a660bff138a8d33d1722086e264c5cdf5a33fea07e9613ec860",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobSecpSudtInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        codeHash:
          "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
        hashType: "type",
        args: "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    outPoint: {
      txHash:
        "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobMultisigLockSudtInputs: LocktimeCell[] = [
  {
    cellOutput: {
      // origin capacity: "0x4a817c800"
      capacity: "0x" + BigInt(20000000000).toString(16),
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: {
        codeHash:
          "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
        hashType: "data",
        args: "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    outPoint: {
      txHash:
        "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
      index: "0x1",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
    since: "0x0",
    depositBlockHash: undefined,
    withdrawBlockHash: undefined,
    sinceValidationInfo: undefined,
  },
];

export const bobAcpSudtInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        codeHash:
          "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
        hashType: "type",
        args: "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    outPoint: {
      txHash:
        "0xbe405f293f2a7c981b7ff77a3b59eac192ebd5416a4f5c41728f84e94fb9f8fa",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const aliceAcpSudtInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356",
        hashType: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: {
        codeHash:
          "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
        hashType: "type",
        args: "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0xd0070000000000000000000000000000",
    outPoint: {
      txHash:
        "0xde542cd098d64b3420b5a9f08d48d8745bff268655e51f473a009423193a30fd",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const tipHeader: Header = {
  compactTarget: "0x1d4543f7",
  dao: "0x85f96976f65bbf2fc56358de57bb2300a51874a76a153b000068217d4ec10507",
  epoch: "0x28d00ae00013e",
  hash: "0x2a68f7a4162a80c2b9cea95cf8b0d2ff43de80eec0fb37c78a9650271053ba24",
  nonce: "0xf37f9e024d995f35443443be1169f4f9",
  number: "0x36281",
  parentHash:
    "0x4b714a2d708e49a2ccc27088861b85038525afe06fc69ba9961af272ed94e3ff",
  proposalsHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x1734b70be18",
  transactionsRoot:
    "0x3aa8da1d229a6fb5d85ae5d71c6db4f6de9eefab288f2d635a79d0f2a610bc67",
  extraHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};

export const bobMultisigDaoInputs: Cell[] = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
      },
      type: {
        codeHash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hashType: "type",
        args: "0x",
      },
    },
    data: "0x0000000000000000",
    outPoint: {
      txHash:
        "0x391c9a8b9a521f85e898c368419f22e9b814e94266c757384aea2ef090056e6b",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

export const bobSecpDaoDepositInput: Cell = {
  cellOutput: {
    capacity: "0x174876e800",
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: {
      codeHash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hashType: "type",
      args: "0x",
    },
  },
  data: "0x0000000000000000",
  outPoint: {
    txHash:
      "0xd28e3c0cb927d5e9ee2103a4f95887558c2f45d3e9711c1d08d7c9e8773cae54",
    index: "0x0",
  },
  blockHash:
    "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
  blockNumber: "0x19249",
};

export const bobSecpDaoWithdrawInput: Cell = {
  cellOutput: {
    capacity: "0x174876e800",
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: {
      codeHash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hashType: "type",
      args: "0x",
    },
  },
  data: "0x4992010000000000",
  outPoint: {
    txHash:
      "0x48cfb73ccd70be0cbfbd1abd7ecf316acbd3e1710db581bf4b8c2d724efdae7f",
    index: "0x0",
  },
  blockHash:
    "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
  blockNumber: "0x1929c",
};
