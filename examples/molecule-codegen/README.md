# Codegen from Molecule Schema

This example demonstrates how to use the `lumos-molecule-codegen` from the `@ckb-lumos/molecule` package to generate TypeScript code from a Molecule schema.

The [`blockchain.mol`](blockchain.mol) is a revised version from the original one in the nervosnetwork/ckb repository. It has been modified to make the unpacked `HashType` and `DepType` fields human-readable.

The difference is shown below:

```diff
+array HashType [byte;1];

table Script {
  code_hash: Bytes32;
- hash_type: byte;
+ hash_type: HashType;
  args: Bytes;
}
```

And we can provide a [`custmoized.ts`](customized.ts) file to override the original `HashType` and `DepType` fields.

To generate the [`generated.ts`](generated.ts) file from the `blockchain.mol` schema, run the following command:

```sh
npx lumos-molecule-codegen
```

To test whether the generated code works, run the following command:

```sh
ts-node main.ts
```
