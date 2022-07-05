import { Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager/lib";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import test from "ava";
import { isP2PKHHint, p2pkh } from "../src/suite/p2pkh";

test("p2pkh#isP2PKHHint", (t) => {
  t.true(
    isP2PKHHint({
      authFlag: "SECP256K1_BLAKE160",
      options: { pubkeyHash: "0x" },
    })
  );
  t.false(
    isP2PKHHint({
      authFlag: "MULTISIG",
      options: { R: 1, M: 2, publicKeyHashes: ["0x", "0x"] },
    })
  );
});

test("p2pkh#p2pkh", (t) => {
  let txSkeleton = TransactionSkeleton({});
  const omniLockScriptConfig: ScriptConfig = {
    CODE_HASH:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    HASH_TYPE: "data",
    TX_HASH:
      "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
    INDEX: "0x0",
    DEP_TYPE: "code",
  };
  const aliceLock: Script = {
    code_hash: omniLockScriptConfig.CODE_HASH,
    hash_type: omniLockScriptConfig.HASH_TYPE,
    args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
  };
  const bobLock: Script = {
    code_hash: omniLockScriptConfig.CODE_HASH,
    hash_type: omniLockScriptConfig.HASH_TYPE,
    args: "0x0162a67949836b389ec146b3b2187e949f7faef67900",
  };

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(
      {
        cell_output: {
          capacity: "0x1",
          lock: aliceLock,
        },
        out_point: {
          tx_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          index: "0x0",
        },
        data: "0x",
      },
      {
        cell_output: {
          capacity: "0x1",
          lock: bobLock,
        },
        out_point: {
          tx_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          index: "0x0",
        },
        data: "0x",
      },
      {
        cell_output: {
          capacity: "0x1",
          lock: aliceLock,
        },
        out_point: {
          tx_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          index: "0x0",
        },
        data: "0x",
      },
      {
        cell_output: {
          capacity: "0x1",
          lock: bobLock,
        },
        out_point: {
          tx_hash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          index: "0x0",
        },
        data: "0x",
      }
    )
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push("0x", "0x", "0x", "0x");
  });
  const adjustedSkeleton = p2pkh(txSkeleton, {
    config: omniLockScriptConfig,
    hints: [
      // bob lock
      {
        authFlag: "ETHEREUM",
        options: { pubkeyHash: "0x62a67949836b389ec146b3b2187e949f7faef679" },
      },
    ],
  });
  t.deepEqual(adjustedSkeleton.signingEntries.length, 1);
  t.truthy(adjustedSkeleton.signingEntries[0].index === 1);
});
