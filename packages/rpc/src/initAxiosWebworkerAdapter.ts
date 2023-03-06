import axios from "axios";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";

/* istanbul ignore next */
export function initAxiosWebworkerAdapter(): void {
  if (
    "ServiceWorkerGlobalScope" in globalThis &&
    globalThis instanceof globalThis?.ServiceWorkerGlobalScope
  ) {
    axios.defaults.adapter = fetchAdapter;
  }
}
