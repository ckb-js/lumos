/** mock template start **/
jest.mock("cross-fetch");
const axiosMock = require("cross-fetch").default;

const { RPC } = require("../");

beforeAll(() => {
  const originalResolve = axiosMock.mockResolvedValue;
  axiosMock.mockResolvedValue = (value) =>
    originalResolve({
      json: () => Promise.resolve(value),
    });
});

/** mock template end **/

describe("mock cross-fetch", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("json() should work as expected", async () => {
    axiosMock.mockResolvedValue({ key: "value" });

    const res = await axiosMock("test-url", {});
    await expect(res.json()).resolves.toEqual({ key: "value" });
  });

  it("rpc should work as expected", async () => {
    const rpc = new RPC("mock-url");

    jest.spyOn(globalThis.Math, "random").mockReturnValue(0.1);
    axiosMock.mockResolvedValue({ id: 1000, result: "0x1" });

    const blockNumber = await rpc.getTipBlockNumber();
    expect(JSON.parse(axiosMock.mock.calls[0][1].body)).toEqual({
      jsonrpc: "2.0",
      id: 1000,
      method: "get_tip_block_number",
      params: [],
    });
    expect(blockNumber).toBe("0x1");
  });
});
