import test from "ava";
import { PendingTransactionsRecorder } from "../src";
import { Transaction, blockchain, utils } from "@ckb-lumos/base";
import * as sinon from "sinon";

let service: PendingTransactionsRecorder;
test.beforeEach(() => {
  service = new PendingTransactionsRecorder({
    rpcUrl: "https://testnet.ckb.dev",
  });
  // @ts-ignore
  service.rpc = {
    sendTransaction: sinon.fake.resolves(
      utils.ckbHash(blockchain.RawTransaction.pack(createMockTransaction()))
    ),
  };
  // @ts-ignore
  service.updatePendingTransactions = sinon.mock();
});
test.afterEach(() => {
  service.stop();
});

test("should create pendding tx recorder", async (t) => {
  const mockTx = createMockTransaction();
  const mockTxHash = utils.ckbHash(blockchain.RawTransaction.pack(mockTx));
  const txHash = await service.sendTransaction(mockTx);
  t.deepEqual(txHash, mockTxHash);
  t.deepEqual(service.getCells([mockTx.outputs[0].lock]), [
    {
      cellOutput: mockTx.outputs[0],
      data: mockTx.outputsData[0],
      outPoint: { txHash: mockTxHash, index: "0x0" },
    },
  ]);
});

function createMockTransaction(): Transaction {
  // https://pudge.explorer.nervos.org/transaction/0xb8d29d6306f7f2a0bd2c97ccc1f21becd962a871a210c186a114445d826ffc6a
  return {
    version: "0x0",
    cellDeps: [
      {
        outPoint: {
          txHash:
            "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
          index: "0x0",
        },
        depType: "depGroup",
      },
    ],
    headerDeps: [],
    inputs: [
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0xae9a6492099ec8676556e2713d291f688c0ff6428a8c438d17bf4b417b263155",
          index: "0x1",
        },
      },
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0x2a3dbac91319578ea8a2578da7b47a78bf1371c04fdfa9c94723eadd68a56549",
          index: "0x0",
        },
      },
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0x0b2ecd098e39bde6b64551b1ab78398e79bb223e710a8110f9ce7137ca78ed76",
          index: "0x0",
        },
      },
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0xb0ca4bd9dff4f65aaf047fb07806291be4a40e6d9f1733822199e2e65a97bd8a",
          index: "0x0",
        },
      },
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0xae9a6492099ec8676556e2713d291f688c0ff6428a8c438d17bf4b417b263155",
          index: "0x0",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x63f61f12560",
        lock: {
          codeHash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0x4e2d278a6cfc15f2e0ac3d550acd8845ff510e84",
        },
      },
    ],
    outputsData: ["0x"],
    witnesses: [
      "0x5500000010000000550000005500000041000000b1e6070a5b3c91f95405d585b3ce233e7d8dca6103ac6c846d686284509f0b91707f53aeddf7d14dfc6c7f1a016c6a94084f14a59902b6a327937ebf23818a1900",
      "0x5500000010000000550000005500000041000000db64b075a33104dd01ff243ef5143aec06eae0b6d341725d8bbc94386f287189769ed4cdd55f9c9006cc5e358d4ffbb5e3790a958fad09d253ff769dfccb172300",
      "0x5500000010000000550000005500000041000000de5966366df8d743ad6ab88f9907773a031d3d0384e96ef9d7ae486856973519316023b10ccac1f5165d2929d8485ce46fe64e3663b1403a7d19ca1696f5f87c00",
      "0x55000000100000005500000055000000410000005b1a71e21c4f24ea024f7d22eaf41da76dd993e77e72ff8024b60b39148363391a0d655354e5ba7acfefa4de70427b21bf65e1375ea42d6c27900f7a16e8d84c00",
      "0x55000000100000005500000055000000410000000d9f8d38948f51776e413a74ae342323a6382bfbdb5d3ddf70d51aa2d3646509522db0bf1c784eef0ebd072fd88355818c3efc3c0281ae00428d5474e067f88e01",
    ],
  };
}
