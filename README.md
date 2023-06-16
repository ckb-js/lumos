# lumos

![build](https://github.com/ckb-js/lumos/actions/workflows/github-ci.yaml/badge.svg)
[![codecov](https://codecov.io/gh/ckb-js/lumos/branch/develop/graph/badge.svg?token=6WJJOOMD2F)](https://codecov.io/gh/ckb-js/lumos)
![license](https://img.shields.io/github/license/ckb-js/lumos)
![Lumos](./assets/lumos.jpg)

> Lumos is still under active development and considered to be a work in progress.

Lumos is a full featured JavaScript/TypeScript based dapp framework for Nervos CKB. It aims to simplify dapp development on Nervos CKB. The [name](https://harrypotter.fandom.com/wiki/Lumos_Maxima) explains what the project is about: the wonderland of CKB, though vast and fertile, still remains dark in most of the parts, lumos tries to shed light upon the land, guiding people into this beautiful new world.

As of now, lumos contains the following components:

- [ckb-indexer](./packages/ckb-indexer): a cell/tx indexer base on [ckb-indexer](https://github.com/nervosnetwork/ckb-indexer).
- [BI](./packages/bi): a big number library for lumos.
- [toolkit](./packages/toolkit): JavaScript toolkit for Nervos CKB. It contains a series of independent tools that can aid development of CKB dapps. This is different from a normal CKB SDK, since it tries to minimize the work done in an SDK, while providing more utilities that could be handy.
- [lumos](./packages/lumos): A root package to integrate of common functions from the Lumos sub-package.
- [base](./packages/base): a base package containing common types and utilities that are used by most packages. If there is a CKB specific task you need to perform, you might want to look here first. Chances are they are already provided.
- [helpers](./packages/helpers): a helper package containing more utilities. The difference between `helpers` and `base`, is that `base` contains pure stateless functions, while `helpers` works in a more intrinsic way: it requires `config-manager` mentioned below to be setup.
- [common-scripts](./packages/common-scripts): integrations for known scripts on CKB. While we try our best to provide integrations for popular CKB scripts, people might be working on innovations every day. As a result, we are also designing a set of APIs, so developers can freely integrate their own scripts into lumos for everyone to use. One integrated, `common-scripts` should be able to leverage those new scripts as well.
- [config-manager](./packages/config-manager): a manager for dealing with differences between different chains, such as mainnet, testnet, or numerous dev chains. We abstract each chain into individual config file. Once loaded, config manager will be able to handle the chain specific logic, so you don't have to deal with this in your own code.
- [transaction-manager](./packages/transaction-manager): a transaction manager for CKB. One problem with UTXO based blockchains, is that a certain amount of gap period exists between a transaction is accepted by a blockchain, and when it is actually committed on chain. During this gap, new cells created by the pending transaction will not be available. Transaction manager package takes care of this. It wraps an indexer instance, and makes sure cells created in pending transactions, are also exposed and available for assembling new transactions. This means you are no longer bounded to one transaction at a time, you can freely send series of transactions as you wish.
- [hd](./packages/hd): an HD wallet manager for CKB. It supports mnemonic and keystore, compatible with `Neuron` and `ckb-cli`, you can load keystore from `Neuron` or `ckb-cli` directly and import mnemonic generated by `Neuron`.
- [hd-cache](./packages/hd-cache): an HD cache manager for CKB. It build a memory cache for derived addresses and live cells of these addresses.
- [rpc](./packages/rpc): RPC module for CKB RPC. Provide type definitions for CKB RPC interface.
- [experiment-tx-assembler](./packages/experiment-tx-assembler/): here are some experimental features for simplifying the transaction assembling process.

## Examples

we have provided some use cases for Lumos, such as interactions with MetaMask, transfers CKB, address conversions, etc. which you can find in [examples](./examples)

## Building

### Requirements

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)

```bash
sudo apt-get update
sudo apt install nodejs
npm install -g pnpm
```

### Build

```bash
pnpm run build
```

### Test (ava)

```bash
pnpm run test
```

### Test Coverage (c8)

```bash
pnpm run test-coverage
```

### Format & Lint

```bash
pnpm run lint
```

### Clean

```bash
pnpm run clean
```
