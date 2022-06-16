import { Script } from "@ckb-lumos/base";
import { predefined } from "@ckb-lumos/config-manager/lib";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import test from "ava";
import { isMultisigHint, adjustMultisig } from "../src/suite/multisig";

test("multisig#isMultisigHint", (t) => {
  t.false(
    isMultisigHint({
      authFlag: "SECP256K1_BLAKE160",
      options: { pubkeyHash: "0x" },
    })
  );
  t.true(
    isMultisigHint({
      authFlag: "MULTISIG",
      options: { R: 1, M: 2, publicKeyHashes: ["0x", "0x"] },
    })
  );
});

test("multisig#adjustMultisig", (t) => {
  let txSkeleton = TransactionSkeleton({});
  const multisigScriptConfig =
    predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  const aliceLock: Script = {
    code_hash: multisigScriptConfig.CODE_HASH,
    hash_type: multisigScriptConfig.HASH_TYPE,
    // this args is calculated accroding to the multisig script algorithm
    // https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction
    args: "0xbd64674aecbe710d38aef01cf0af751cc3d0586d",
  };

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
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
    })
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push("0x");
  });
  const adjustedSkeleton = adjustMultisig(txSkeleton, {
    config: multisigScriptConfig,
    hints: [
      {
        authFlag: "MULTISIG",
        options: {
          R: 1,
          M: 2,
          publicKeyHashes: [
            "0xa08bcc398854db4eaffd9c28b881c65f91e3a28b",
            "0x62a67949836b389ec146b3b2187e949f7faef679",
            "0xc5f3f4de4d5c65a47dadf82b0a465fd17b2ea595",
          ],
        },
      },
    ],
  });
  t.deepEqual(adjustedSkeleton.signingHints.length, 2);
  // fisrt offset should be 4(flags) + 20 * 3(n signers) = 64
  t.deepEqual(adjustedSkeleton.signingHints[0].signatureOffset, 64);
  // second offset should be 64 + 65(first signature length) = 129
  t.deepEqual(adjustedSkeleton.signingHints[1].signatureOffset, 129);
});
