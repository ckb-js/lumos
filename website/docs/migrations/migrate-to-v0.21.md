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
