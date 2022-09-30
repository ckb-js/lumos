import { BytesLike, bytes } from "@ckb-lumos/codec";
import { createTransactionFromSkeleton, TransactionSkeletonType } from ".";
import { blockchain } from "@ckb-lumos/base";
import { CKBHasher } from "@ckb-lumos/base/lib/utils";

const { RawTransaction } = blockchain;

type HashAlgorithm = "ckb-blake2b-256" | "ckb-blake2b-160";

interface Hasher {
  update(data: BytesLike): Hasher;
  digestHex(): string;
}

function createHasher(algorithm: HashAlgorithm): Hasher {
  switch (algorithm) {
    case "ckb-blake2b-256":
      return new CKBHasher({ outLength: 32 });

    case "ckb-blake2b-160":
      return new CKBHasher({ outLength: 20 });
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
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
  txSkeleton: TransactionSkeletonType,
  hashContentExceptRawTx: BytesLike,
  hashAlgorithm: HashAlgorithm = "ckb-blake2b-256"
): boolean {
  const rawTxHasher = createHasher(hashAlgorithm);
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = rawTxHasher.update(RawTransaction.pack(tx)).digestHex();

  const hasher = createHasher(hashAlgorithm);
  hasher.update(txHash);
  hasher.update(hashContentExceptRawTx);
  const actual = hasher.digestHex();
  return bytes.equal(messagesForSigning, actual);
}
