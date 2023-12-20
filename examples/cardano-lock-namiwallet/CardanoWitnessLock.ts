import { blockchain, table } from "@ckb-lumos/lumos/codec";

const Byte64 = blockchain.createFixedHexBytesCodec(64);

export const CardanoWitnessLock = table(
  {
    pubkey: blockchain.Byte32,
    signature: Byte64,
    sig_structure: blockchain.Bytes,
  },
  ["pubkey", "signature", "sig_structure"]
);
