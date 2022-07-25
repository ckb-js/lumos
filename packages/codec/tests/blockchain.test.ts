import test from "ava";
import { BytesOpt, WitnessArgs, Script, _HashType } from "../src/blockchain";
import { bytify, hexify } from "../src/bytes";
import { byteVecOf, table } from "../src/molecule";
import { randomBytes } from "crypto";

const SECP256K1_SIGNATURE_LENGTH = 65;

test("secp256k1 witness args", (t) => {
  const unsigned = WitnessArgs.pack({
    lock: Buffer.alloc(SECP256K1_SIGNATURE_LENGTH),
  });

  t.deepEqual(
    unsigned,
    bytify(
      "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  );

  t.deepEqual(
    WitnessArgs.unpack(
      "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    ),
    {
      lock: hexify(Buffer.alloc(SECP256K1_SIGNATURE_LENGTH)),
      inputType: undefined,
      outputType: undefined,
    }
  );

  const signature = bytify(randomBytes(SECP256K1_SIGNATURE_LENGTH));
  const signed = WitnessArgs.pack({ lock: hexify(signature) });

  t.deepEqual(
    signed.slice(0, -SECP256K1_SIGNATURE_LENGTH),
    unsigned.slice(0, -SECP256K1_SIGNATURE_LENGTH),
    "header of signed witness is not valid"
  );

  t.deepEqual(
    signed.slice(-SECP256K1_SIGNATURE_LENGTH),
    signature,
    "signature is not valid"
  );
});

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
    lock: { signature: "0x" + "00".repeat(SECP256K1_SIGNATURE_LENGTH) },
  });
  const omniLockWitnessPlaceholder = bytify(
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

test("Script codec", (t) => {
  const script = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type" as _HashType,
    args: "0x0000",
  };
  t.deepEqual(
    hexify(Script.pack(script)),
    "0x370000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801020000000000"
  );
});
