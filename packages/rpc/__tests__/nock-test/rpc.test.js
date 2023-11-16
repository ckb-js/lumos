const nock = require("nock");
const { RPC } = require("../../lib");

const nodeUrl = "http://nock-rpc.com";

describe("rpc", () => {
  it("should throw time exceeded error", async () => {
    nock(nodeUrl)
      .post("/")
      .delay(1000)
      .reply(200, (uri, requestBody) => {
        return {
          jsonrpc: "2.0",
          result:
            "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
          id: requestBody.id,
        };
      });
    const rpc = new RPC(nodeUrl, { timeout: 100 });
    try {
      await rpc.getBlockHash("0x01");
    } catch (err) {
      expect(err.message).toMatch(/aborted/);
    }
  });
  it("should call rpc successful", async () => {
    nock(nodeUrl)
      .post("/")
      .delay(1000)
      .reply(200, (uri, requestBody) => {
        return {
          jsonrpc: "2.0",
          result:
            "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
          id: requestBody.id,
        };
      });
    const rpc = new RPC(nodeUrl, { timeout: 2000 });
    const res =  await rpc.getBlockHash("0x01");
    expect(res).toEqual('0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606')
  });
});
