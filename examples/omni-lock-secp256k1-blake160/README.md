# Lumos & Omnilock secp256k1_blake160

Nervos maintains a powerful lock
called [Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) (previously named RC lock), which
can use private key as a signer. This example will show how to use Lumos to send a transaction using Omnilock

## Quick Start

> we should [build](..) Lumos project first before we start this example

```
npm run build
cd examples/omni-lock-own-signature
npm start
```

## Links

- [Nervos Faucet](https://faucet.nervos.org/) - Claim Nervos testnet CKB
- [Omnilock](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md) - Omnilock intro
