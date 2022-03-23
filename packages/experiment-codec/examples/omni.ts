import {
  BytesOpt,
  byteVecOf,
  option,
  table,
  UnusedOpt,
} from "@ckb-lumos/experiment-codec";

const OmniLockWitnessLock = table(
  {
    signature: BytesOpt,
    rcIdentity: UnusedOpt,
    preimage: UnusedOpt,
  },
  ["signature", "rcIdentity", "preimage"]
);

const OmniLockWitness = table(
  {
    lock: option(byteVecOf(OmniLockWitnessLock)),
    inputType: BytesOpt,
    outputType: BytesOpt,
  },
  ["lock", "inputType", "outputType"]
);

const packed = OmniLockWitness.pack({
  lock: {
    signature: "0x" + "00".repeat(65),
  },
});

console.log(packed);

const unpacked = OmniLockWitness.unpack(packed);
console.log(JSON.stringify(unpacked, null, 2));
