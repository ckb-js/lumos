import { blockchain } from "@ckb-lumos/base";
import { molecule } from "@ckb-lumos/codec";

const { Byte32, Bytes } = blockchain;
const Byte64 = blockchain.createFixedHexBytesCodec(64);

export const CardanoWitnessLock = molecule.table(
  {
    pubkey: Byte32,
    signature: Byte64,
    sig_structure: Bytes,
  },
  ["pubkey", "signature", "sig_structure"]
);
