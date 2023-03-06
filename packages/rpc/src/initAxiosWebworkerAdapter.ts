/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";

// this is a hack for passing unit tests
/** @internal */
export function initAxiosWebworkerAdapter(): void {
  if (
    // @ts-ignore
    "ServiceWorkerGlobalScope" in globalThis &&
    // @ts-ignore
    globalThis instanceof globalThis?.ServiceWorkerGlobalScope
  ) {
    /* istanbul ignore next */ const fetchAdapter = require("@vespaiach/axios-fetch-adapter");
    /* istanbul ignore next */ axios.defaults.adapter = fetchAdapter.default;
  }
}
