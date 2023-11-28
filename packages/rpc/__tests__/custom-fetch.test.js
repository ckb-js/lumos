const { RPC } = require("..");

describe("custom fetch", () => {
  test("should work", async () => {
    const customizedFetch = jest.fn((_, { body }) =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            jsonrpc: "2.0",
            result: "0x8dd",
            id: JSON.parse(body).id,
          }),
      })
    );

    const rpc = new RPC("", { fetch: customizedFetch });
    await rpc.getTipBlockNumber();

    expect(customizedFetch).toBeCalled();
    expect(JSON.parse(customizedFetch.mock.calls[0][1].body)).toHaveProperty(
      "method",
      "get_tip_block_number"
    );
  });
});
