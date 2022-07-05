# @ckb-lumos/omnilock

A toolkit for [omnilock](https://blog.cryptape.com/omnilock-a-universal-lock-that-powers-interoperability-1), helping you to use omnilock with simple APIs.

## Quick Start

Here is an example that Alice transfer 65 CKBs to Bob using `@ckb-lumos/omnilock`.

```ts
  import { createDefaultOmnilockSuite } from '@ckb-lumos/omnilock'

  const ALICE_PRIVKEY = <YOUR PRIVATE KEY>
  const aliceAddress = key.privateKeyToBlake160(ALICE_PRIVKEY);
 
  const auth: AuthByP2PKH = {
    authFlag: "SECP256K1_BLAKE160",
    options: { pubkeyHash: aliceAddress },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_CONFIG,
  });

  // create omni lock script
  const aliceLock = suite.createOmnilockScript({ auth });

  const bobLock = <ANY LOCK>

  let txSkeleton = TransactionSkeleton({});

  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (let cell of indexer
    .collector({
      lock: aliceLock,
      type: "empty",
      data: "0x",
    })
    .collect()) {
    collectedCells.push(cell);
    collectedSum = collectedSum.add(BI.from(cell.cell_output.capacity));

    if (collectedSum.gt(130_00000000)) break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collectedCells)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    // Alice's cells + Bob's cell
    outputs.push(
      {
        data: "0x",
        cell_output: {
          lock: aliceLock,
          // 1000000 shannons for pay fee
          capacity: collectedSum.sub(65_00000000).sub(1000000).toHexString(),
        },
      },
      {
        data: "0x",
        cell_output: {
          lock: bobLock,
          capacity: BI.from(65_00000000).toHexString(),
        },
      }
    )
  );

  // add cell deps and calculate sign messages by adjust tx
  const { adjusted } = await suite.adjust(txSkeleton);
  txSkeleton = adjusted;

  // fillin sinatures
  txSkeleton = await suite.seal(txSkeleton, (entry) =>
    key.signRecoverable(entry.message, ALICE_PRIVKEY)
  );

  // send tx
  const txHash = await rpc.send_transaction(
    createTransactionFromSkeleton(txSkeleton)
  );
```
