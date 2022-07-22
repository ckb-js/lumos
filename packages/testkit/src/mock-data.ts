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
      nodeId: "QmVhtdYKJ7Na3Xmynmm1xA7ZTh41FJmYrQm8Uk88S8iqJp",
      protocols: [
        {
          id: "0x64",
          name: "/ckb/syn",
          supportVersions: ["1"],
        },
        {
          id: "0x65",
          name: "/ckb/rel",
          supportVersions: ["1"],
        },
        {
          id: "0x66",
          name: "/ckb/tim",
          supportVersions: ["1"],
        },
        {
          id: "0x6e",
          name: "/ckb/alt",
          supportVersions: ["1"],
        },
        {
          id: "0x3",
          name: "/ckb/flr",
          supportVersions: ["0.0.1"],
        },
        {
          id: "0x4",
          name: "/ckb/disconnectmsg",
          supportVersions: ["0.0.1"],
        },
        {
          id: "0x0",
          name: "/ckb/ping",
          supportVersions: ["0.0.1"],
        },
        {
          id: "0x1",
          name: "/ckb/discovery",
          supportVersions: ["0.0.1"],
        },
        {
          id: "0x2",
          name: "/ckb/identify",
          supportVersions: ["0.0.1"],
        },
      ],
      version: "0.42.0 (bb888fe 2021-05-26)",
    },
    info
  );
}
