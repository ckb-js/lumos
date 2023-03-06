import axios from "axios";

// TODO: this is a hack for passing unit tests
// And a test for here, when the environment is webworker, is needed
export function initAxiosWebworkerAdapter(): void {
  /* istanbul ignore if */
  if (
    "ServiceWorkerGlobalScope" in globalThis &&
    globalThis instanceof globalThis?.ServiceWorkerGlobalScope
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fetchAdapter = require("@vespaiach/axios-fetch-adapter");
    axios.defaults.adapter = fetchAdapter.default;
  }
}
