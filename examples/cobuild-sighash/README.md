# CoBuild Sighash Example

This code example demonstrates how to use `@ckb-lumos/cobuild` with a lock that supports the CoBuild protocol. We will be working with a fake schema for the sUDT script to mint sUDT through a human-readable signing message.

```
union SudtActions {
  Mint,
}

table Mint {
  to: Script,
  amount: Uint128,
}
```

## Links

- [CoBuild](https://talk.nervos.org/t/ckb-transaction-cobuild-protocol-overview/7702)
