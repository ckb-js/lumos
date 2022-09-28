import { BytesLike, number } from "@ckb-lumos/codec";
import { createTransactionFromSkeleton, TransactionSkeletonType } from ".";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import blake2b from "blake2b";
import { blockchain } from "@ckb-lumos/base";

const { RawTransaction } = blockchain;

type HashAlgorithm = "ckb-blake2b-256" | "ckb-blake2b-160";

interface Hasher {
  update(data: BytesLike): Hasher;
  digest(): string;
}

class Blake2bHasher implements Hasher {
  constructor(
    outlength: number,
    key: Uint8Array | undefined,
    salt: Uint8Array | undefined,
    personal: Uint8Array | undefined
  ) {
    this.hasher = blake2b(outlength, key, salt, personal);
  }
  private hasher: blake2b.Blake2b;

  update(data: BytesLike) {
    this.hasher.update(bytify(data));
    return this;
  }

  digest() {
    return hexify(this.hasher.digest());
  }
}

function createHasher(algorithm: HashAlgorithm): Hasher {
  switch (algorithm) {
    case "ckb-blake2b-256":
      return new Blake2bHasher(
        32,
        undefined,
        undefined,
        Buffer.from("ckb-default-hash")
      );

    case "ckb-blake2b-160":
      return new Blake2bHasher(
        20,
        undefined,
        undefined,
        Buffer.from("ckb-default-hash")
      );
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
}

function getWitnessLength(witnesses: Uint8Array) {
  return number.Uint64.pack(witnesses.length).buffer;
}

/**
 * Validate a P2PKH(Pay to public key hash) message
 * @param messagesForSigning the message digest for signing. means hash(rawTransaction | extraData).
 * @param rawTransaction raw transaction object
 * @param hashContentExceptRawTx content to be hashed other than rawTransaction, is generally processed witness
 * @param hashAlgorithm hash algorithm for signing. Default is `"ckb-blake2b-256"`
 * @returns the validate result. unless all messages equals, it will return false.
 */
export function validateP2PKHMessage(
  messagesForSigning: BytesLike,
  rawTransaction: TransactionSkeletonType,
  hashContentExceptRawTx: BytesLike,
  hashAlgorithm: HashAlgorithm = "ckb-blake2b-256"
): boolean {
  const rawTxHasher = createHasher(hashAlgorithm);
  const tx = createTransactionFromSkeleton(rawTransaction);
  const txHash = rawTxHasher.update(RawTransaction.pack(tx)).digest();

  const hasher = createHasher(hashAlgorithm);
  const message = hexify(messagesForSigning);
  const witness = bytify(hashContentExceptRawTx);
  const witnessLength = getWitnessLength(witness);
  hasher.update(txHash);
  hasher.update(witnessLength);
  hasher.update(witness);
  const actual = hasher.digest();
  if (actual !== message) {
    return false;
  }

  return true;
}
