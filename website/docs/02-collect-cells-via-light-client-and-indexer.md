---
title: How to collect cells via LightClient and Indexer
sidebar_position: 3
---

# Recipes: How to collect cells via LightClient and Indexer

 - **indexer**: indexer is service for creating cell and transaction indexes. [see more](https://github.com/nervosnetwork/ckb-indexer)
 - **light-client**: the light-client is a node that can verify transactions without all blocks data, see [rfc 44](https://github.com/nervosnetwork/rfcs/pull/370/files) and [rfc 45](https://github.com/nervosnetwork/rfcs/pull/375/files)
 - **cell collector**: cell collector is a tool for index and query cells with certain properties.


### Usage

A `CellCollector` has been implemented in `lumos`, which requires a `TerminableCellFetcher` interface as the cell source, and we have built in a `TerminableCellAdapter` to convert `LightClientRPC` and `indexerRPC` to `TerminableCellFetcher`.

``` ts
import { CellCollector, RPC as IndexerRPC, TerminableCellAdapter } from "@ckb-lumos/indexer";
import { LightClientRPC } from "@ckb-lumos/light-client";

const lightClientRPC = new LightClientRPC("http://....");
const indexerRPC = new IndexerRPC("http://....");

// Collect cells via indexer
const collector = new CellCollector(
  new TerminableCellAdapter(indexerRPC),
  {
    lock: {
      code_hash: "0x...",
      hash_type: "type",
      args: "0x...",
    },
  }
);

// Collect cells via LightClient
const collector = new CellCollector(
  new TerminableCellAdapter(lightClientRPC),
  {
    lock: {
      code_hash: "0x...",
      hash_type: "type",
      args: "0x...",
    },
  }
);


// Collect cells
const collected: Cell[] = [];
for await (const cell of collector.collect()) {
  collected.push(cell);
}
```