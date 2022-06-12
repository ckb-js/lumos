import {
  byteOf,
  byteVecOf,
  option,
  table,
  vector,
} from "@ckb-lumos/codec/lib/molecule";
import {
  BytesOpt,
  createFixedHexBytesCodec,
} from "@ckb-lumos/codec/lib/blockchain";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";

const Hexify = { pack: bytify, unpack: hexify };

const Identity = createFixedHexBytesCodec(21);

const SmtProof = byteVecOf(Hexify);

const SmtProofEntry = table(
  {
    mask: byteOf(Hexify),
    proof: SmtProof,
  },
  ["mask", "proof"]
);

const SmtProofEntryVec = vector(SmtProofEntry);

const OmniIdentity = table(
  {
    identity: Identity,
    proofs: SmtProofEntryVec,
  },
  ["identity", "proofs"]
);

const OmniIdentityOpt = option(OmniIdentity);

export const OmnilockWitnessLock = table(
  {
    signature: BytesOpt,
    omni_identity: OmniIdentityOpt,
    preimage: BytesOpt,
  },
  ["signature", "omni_identity", "preimage"]
);
