import { Base } from "./Base";
import { Method } from "./method";
import { CKBComponents } from "./types/api";
import { formatter as paramsFormatter } from "./paramsFormatter";
import * as resultFormatter from "./resultFormatter";
import {
  IdNotMatchedInBatchException,
  MethodInBatchNotFoundException,
  PayloadInBatchException,
} from "./exceptions";
import { RPCConfig } from "./types/common";
import fetch_ from "cross-fetch";
import AbortController from "abort-controller";

export const ParamsFormatter = paramsFormatter;
export const ResultFormatter = resultFormatter;

export class CKBRPC extends Base {
  #config: RPCConfig;
  #node: CKBComponents.Node = {
    url: "",
  };

  get node(): CKBComponents.Node {
    return this.#node;
  }

  #paramsFormatter = paramsFormatter;

  get paramsFormatter(): typeof paramsFormatter {
    return this.#paramsFormatter;
  }

  #resultFormatter = resultFormatter;

  get resultFormatter(): typeof resultFormatter {
    return this.#resultFormatter;
  }

  constructor(url: string, config: Partial<RPCConfig> = {}) {
    super();
    this.setNode({ url });
    const { timeout = 30000, fetch = fetch_ } = config;
    this.#config = { timeout, fetch };

    Object.defineProperties(this, {
      addMethod: {
        value: this.addMethod,
        enumerable: false,
        writable: false,
        configurable: false,
      },
      setNode: {
        value: this.setNode,
        enumerable: false,
        writable: false,
        configurable: false,
      },
      // createBatchRequest: { value: this.createBatchRequest, enumerable: false, writable: false, configurable: false },
    });

    Object.keys(this.rpcProperties).forEach((name) => {
      this.addMethod({ name, ...this.rpcProperties[name] }, this.#config);
    });
  }

  public setNode(node: CKBComponents.Node): CKBComponents.Node {
    Object.assign(this.node, node);
    return this.node;
  }

  public addMethod = (
    options: CKBComponents.Method,
    config?: RPCConfig
  ): void => {
    const method = new Method(this.node, options, config);

    Object.defineProperty(this, options.name, {
      value: method.call,
      enumerable: true,
    });
  };
  /* eslint-disable */
  public createBatchRequest = <
    N extends keyof Base,
    P extends (string | number | object)[],
    R = any[]
  >(
    // TODO fix me
    // params: [method: N, ...rest: P][] = [],
    params: any = []
  ) => {
    const ctx = this;

    // TODO fix me
    const proxied: any = new Proxy([], {
      set(...p) {
        const methods = Object.keys(ctx);
        if (p[1] !== "length") {
          const name = p?.[2]?.[0];
          if (methods.indexOf(name) === -1) {
            throw new MethodInBatchNotFoundException(name);
          }
        }
        return Reflect.set(...p);
      },
    });

    Object.defineProperties(proxied, {
      add: {
        value(...args: P) {
          this.push(args);
          return this;
        },
      },
      remove: {
        value(i: number) {
          this.splice(i, 1);
          return this;
        },
      },
      exec: {
        async value() {
          // TODO fix me
          const payload = proxied.map(([f, ...p]: any, i: any) => {
            try {
              const method = new Method(ctx.node, {
                ...ctx.rpcProperties[f],
                name: f,
              });
              return method.getPayload(...p);
            } catch (err) {
              throw new PayloadInBatchException(i, (err as Error).message);
            }
          });

          const controller = new AbortController();
          const signal = controller.signal as AbortSignal;

          const timeout = setTimeout(
            () => controller.abort(),
            ctx.#config.timeout
          );

          const batchRes = await ctx.#config
            .fetch(ctx.#node.url, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
              signal,
            })
            .then((res) => res.json());

          clearTimeout(timeout);

          return batchRes.map((res: any, i: number) => {
            if (res.id !== payload[i].id) {
              return new IdNotMatchedInBatchException(i, payload[i].id, res.id);
            }
            return (
              ctx.rpcProperties[proxied[i][0]].resultFormatters?.(res.result) ??
              res.result
            );
          });
        },
      },
    });
    // TODO fix me
    params.forEach((p: any) => proxied.push(p));

    return proxied as typeof proxied & {
      add: (n: N, ...p: P) => typeof proxied;
      remove: (index: number) => typeof proxied;
      exec: () => Promise<R>;
    };
  };
}

export { CKBRPC as RPC };
