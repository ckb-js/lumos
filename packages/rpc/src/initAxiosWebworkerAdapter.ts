import axios from "axios";

// this is a hack for passing unit tests
export function initAxiosWebworkerAdapter(): void {
  if (
    "ServiceWorkerGlobalScope" in globalThis &&
    globalThis instanceof globalThis?.ServiceWorkerGlobalScope
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fetchAdapter = require("@vespaiach/axios-fetch-adapter");
    axios.defaults.adapter = fetchAdapter.default;
  }
}
