# Migrate to Lumos v0.21

### Deprecated the `httpAgent` and `httpsAgent` in `RPC.setNode`

Please use the `fetch` option in `RPC` constructor instead.

```diff
-const rpc = new RPC(url)
+const rpc = new RPC(
+ url,
+ { fetch: (request, init) => originalFetch(request, { ...init, keepalive: true }) },
+)
-rpc.setNode({ url, httpAgent, httpsAgent })
+rpc.setNode({ url })
```

If you are still in working with Node.js(or Electron) runtime, you can migrate to `node-fetch` to continue using the customized agent

```ts
import fetch from "node-fetch"
import { Agent } from "http"

const rpc = new RPC(url, {
  fetch: (request, init) => {
    return fetch(request, { ...init, httpAgent: new Agent({ keepAlive: true }) })
  },
})
```
