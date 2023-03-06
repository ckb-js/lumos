/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";

// this is a hack for passing unit tests
export function initAxiosWebworkerAdapter(): void {
  if (
    "ServiceWorkerGlobalScope" in globalThis &&
    globalThis instanceof globalThis?.ServiceWorkerGlobalScope
  ) {
    /* istanbul ignore next */ const fetchAdapter = require("@vespaiach/axios-fetch-adapter");
    /* istanbul ignore next */ axios.defaults.adapter = fetchAdapter.default;
  }
}
