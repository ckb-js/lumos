import axios from "axios";
import { IdNotMatchException, ResponseException } from "./exceptions";
import { CKBComponents } from "./types/api";
import { RPCConfig } from "./types/common";

export class Method {
  #name: string;
  #config: RPCConfig;

  get name(): string {
    return this.#name;
  }

  #options: CKBComponents.Method = {
    name: "",
    method: "",
    paramsFormatters: [],
    resultFormatters: undefined,
  };

  #node: CKBComponents.Node;

  constructor(
    node: CKBComponents.Node,
    options: CKBComponents.Method,
    config: RPCConfig = { timeout: 30000 }
  ) {
    this.#node = node;
    this.#options = options;
    this.#name = options.name;
    this.#config = config;

    Object.defineProperty(this.call, "name", {
      value: options.name,
      configurable: false,
      writable: false,
    });
  }

  /* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/explicit-module-boundary-types */
  public call = (...params: (string | number | object)[]) => {
    const payload = this.getPayload(...params);
    return axios({
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      data: payload,
      url: this.#node.url,
      httpAgent: this.#node.httpAgent,
      httpsAgent: this.#node.httpsAgent,
      timeout: this.#config.timeout,
    }).then((res) => {
      if (res.data.id !== payload.id) {
        throw new IdNotMatchException(payload.id, res.data.id);
      }
      if (res.data.error) {
        throw new ResponseException(JSON.stringify(res.data.error));
      }
      return (
        this.#options.resultFormatters?.(res.data.result) ?? res.data.result
      );
    });
  };

  public getPayload = (...params: (string | number | object)[]) => {
    const data = params.map(
      (p, i) =>
        (this.#options.paramsFormatters[i] &&
          this.#options.paramsFormatters[i](p)) ||
        p
    );
    const id = Math.round(Math.random() * 10000);
    const payload = {
      id,
      method: this.#options.method,
      params: data,
      jsonrpc: "2.0",
    };
    return payload;
  };
}
/* eslint-enable @typescript-eslint/ban-types, @typescript-eslint/explicit-module-boundary-types */
