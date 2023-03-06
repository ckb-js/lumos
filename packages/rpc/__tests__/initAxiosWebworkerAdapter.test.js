const {
  initAxiosWebworkerAdapter,
} = require("../lib/initAxiosWebworkerAdapter");

jest.mock("@vespaiach/axios-fetch-adapter", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const axios = require("axios");

const defaultAdapter = axios.defaults.adapter;
const fetchAdapter = require("@vespaiach/axios-fetch-adapter").default;

describe("initAxiosWebworkerAdapter", () => {
  it("Should the adapter is default adapter when it's not on service worker", () => {
    initAxiosWebworkerAdapter();
    expect(axios.defaults.adapter).toBe(defaultAdapter);
  });

  it("Should the adapter become fetch adapter when it's on service worker", () => {
    globalThis.ServiceWorkerGlobalScope = Object;
    initAxiosWebworkerAdapter();
    expect(axios.defaults.adapter).toBe(fetchAdapter);
  });
});
