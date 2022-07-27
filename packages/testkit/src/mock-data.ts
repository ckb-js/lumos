import { LocalNode } from "@ckb-lumos/base";

export function localNode(info?: Partial<LocalNode>): LocalNode {
  return Object.assign(
    {},
    {
      active: true,
      addresses: [
        {
          address: "/ip4/161.117.239.19/tcp/8115/p2p/QmXLNuWy66RFaEkbu6ovPPiGFhC2rVQ8iENcn3e3JD42Yx",
          score: "0x1",
        },
        {
          address: "/ip4/0.0.0.0/tcp/8115",
          score: "0x1",
        },
      ],
      connections: "0x5",
      nodeId: "QmXLNuWy66RFaEkbu6ovPPiGFhC2rVQ8iENcn3e3JD42Yx",
      protocols: [
        {
          id: "0x64",
          name: "/ckb/syn",
          supportVersions: ["1", "2"],
        },
        {
          id: "0x67",
          name: "/ckb/relay",
          supportVersions: ["2"],
        },
        {
          id: "0x66",
          name: "/ckb/tim",
          supportVersions: ["1", "2"],
        },
        {
          id: "0x6e",
          name: "/ckb/alt",
          supportVersions: ["1", "2"],
        },
        {
          id: "0x2",
          name: "/ckb/identify",
          supportVersions: ["0.0.1", "2"],
        },
        {
          id: "0x0",
          name: "/ckb/ping",
          supportVersions: ["0.0.1", "2"],
        },
        {
          id: "0x1",
          name: "/ckb/discovery",
          supportVersions: ["0.0.1", "2"],
        },
        {
          id: "0x3",
          name: "/ckb/flr",
          supportVersions: ["0.0.1", "2"],
        },
        {
          id: "0x4",
          name: "/ckb/disconnectmsg",
          supportVersions: ["0.0.1", "2"],
        },
      ],
      version: "0.101.4 (7d03c55 2022-01-18)",
    },
    info
  );
}
