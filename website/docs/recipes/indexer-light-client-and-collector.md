# Collector via Indexer or Light-Client

The [CKB-Indexer](https://github.com/nervosnetwork/ckb-indexer)
and [CKB Light Client](https://github.com/nervosnetwork/ckb-light-client) both can be role as indexer for collecting
cells, so they both work as Lumos' CellCollector

:::info
To make the [CKB client](https://github.com/nervosnetwork/ckb/releases) role as an indexer, make sure the **CKB client >= 0.105.0**
with [indexer on](https://github.com/nervosnetwork/ckb/pull/3609)

To make the [Light client](https://github.com/nervosnetwork/ckb-light-client) role as an indexer, make sure scripts you care about has
been [set_scripts](https://github.com/nervosnetwork/ckb-light-client#set_scripts)
:::

```ts
import { CellCollector, RPC as CkbIndexerRpc, TerminableCellAdapter } from "@ckb-lumos/ckb-indexer"
import { RPC as CkbRpc } from "@ckb-lumos/rcp"
import { LightClientRPC } from "@ckb-lumos/light-client"

// const cellFetcher = new CkbRpc("https://localhost:8114") // ckb RPC entry
// const cellFetcher = new CkbIndexerRpc("https://localhost:8116") // ckb-indexer RPC entry
const cellFetcher = new LightClientRPC("http://localhost:8118") // light-client RPC entry

const collector = new CellCollector(new TerminableCellAdapter(cellFetcher), { lock: someLock })

// Collect cells
const collected: Cell[] = []
for await (const cell of collector.collect()) {
  collected.push(cell)
}
```
