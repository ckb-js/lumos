import { LocalNode } from "@ckb-lumos/base";

export function localNode(info?: Partial<LocalNode>): LocalNode {
  return Object.assign(
    {},
    {
      active: true,
      addresses: [
        {
          address: "/ip4/0.0.0.0/tcp/8115",
          score: "0x1",
        },
      ],
      connections: "0x0",
      node_id: "QmVhtdYKJ7Na3Xmynmm1xA7ZTh41FJmYrQm8Uk88S8iqJp",
      protocols: [
        {
          id: "0x64",
          name: "/ckb/syn",
          support_versions: ["1"],
        },
        {
          id: "0x65",
          name: "/ckb/rel",
          support_versions: ["1"],
        },
        {
          id: "0x66",
          name: "/ckb/tim",
          support_versions: ["1"],
        },
        {
          id: "0x6e",
          name: "/ckb/alt",
          support_versions: ["1"],
        },
        {
          id: "0x3",
          name: "/ckb/flr",
          support_versions: ["0.0.1"],
        },
        {
          id: "0x4",
          name: "/ckb/disconnectmsg",
          support_versions: ["0.0.1"],
        },
        {
          id: "0x0",
          name: "/ckb/ping",
          support_versions: ["0.0.1"],
        },
        {
          id: "0x1",
          name: "/ckb/discovery",
          support_versions: ["0.0.1"],
        },
        {
          id: "0x2",
          name: "/ckb/identify",
          support_versions: ["0.0.1"],
        },
      ],
      version: "0.42.0 (bb888fe 2021-05-26)",
    },
    info,
  );
}
