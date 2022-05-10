# Lumos Works with private key

Nervos maintains a powerful lock
called [Omni Lock](https://github.com/XuJiandong/docs-bank/blob/master/omni_lock.md) (previously named RC lock), which
can use private key as a signer. This example will show how to use Lumos to send a transaction using Omni lock

## Quick Start

> we should [build](..) Lumos project first before we start this example

```
yarn run build
yarn run build-release
cd examples/omni-lock-own-signature
yarn start
```

## Links

- [Nervos Faucet](https://faucet.nervos.org/) - Claim Nervos testnet CKB
- [Omni lock](https://github.com/XuJiandong/docs-bank/blob/master/omni_lock.md) - Omni lock intro
