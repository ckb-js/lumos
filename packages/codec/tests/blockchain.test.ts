import test from "ava";
import { BytesOpt } from "../src/blockchain";
import { toArrayBuffer } from "../src/utils";
import { byteVecOf, table } from "../src/molecule";

test("a real world Omni Lock witness should work as expected", (t) => {
  const OmniLockWitnessLock = table(
    {
      signature: BytesOpt,
      rc_identity: BytesOpt,
      preimage: BytesOpt,
    },
    ["signature", "rc_identity", "preimage"]
  );

  // connect WitnessArgs bytes with OmniLock WitnessWitnessLock
  const OmniLockWitness = table(
    {
      // lock: BytesOpt,
      lock: byteVecOf(OmniLockWitnessLock),
      type_input: BytesOpt,
      type_output: BytesOpt,
    },
    ["lock", "type_input", "type_output"]
  );

  const packedWitness = OmniLockWitness.pack({
    // secp256k1 signature in CKB is 65 bytes
    lock: { signature: "0x" + "00".repeat(65) },
  });
  const omniLockWitnessPlaceholder = toArrayBuffer(
    // the hex is calculated by the following code
    // SerializeWitnessArgs({
    //   lock: SerializeRcLockWitnessLock({
    //     signature: toArrayBuffer("0x" + "00".repeat(65)),
    //   }),
    // })
    "0x690000001000000069000000690000005500000055000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  );

  t.is(omniLockWitnessPlaceholder.byteLength, 105);
  t.deepEqual(packedWitness, omniLockWitnessPlaceholder);
});
