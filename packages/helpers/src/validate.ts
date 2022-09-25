import { BytesLike, number } from "@ckb-lumos/codec";
import { createTransactionFromSkeleton, TransactionSkeletonType } from ".";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import blake2b from "blake2b";
import pick from "lodash.pick";
import { blockchain } from "@ckb-lumos/base";
// FIXME: can not import this path, because it may cause circular dependency
// import { SECP_SIGNATURE_PLACEHOLDER } from "@ckb-lumos/common-scripts/lib/helper";

export const SECP_SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const { WitnessArgs, RawTransaction } = blockchain;

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
  }
}

/**
 * Group transaction inputs by cells lock
 * @param inputs the inputs of the transaction
 * @returns An array. the item is a list of current group item index in inputs
 */
function groupInputs(inputs: TransactionSkeletonType["inputs"]): number[][] {
  const groupedInputs = new Map<string, number[]>();
  for (let i = 0; i < inputs.size; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const input = inputs.get(i)!;
    const { lock } = input.cellOutput;
    const key = `${lock.hashType}-${lock.codeHash}-${lock.args}`;
    const group = groupedInputs.get(key) || [];
    group.push(i);
    groupedInputs.set(key, group);
  }
  return Array.from(groupedInputs.values());
}

function getWitnessLength(witnesses: Uint8Array) {
  return number.Uint64.pack(witnesses.length).buffer;
}

export function validateTransaction(
  messageForSigning: BytesLike[],
  rawTransaction: TransactionSkeletonType,
  extraData: BytesLike[],
  hashAlgorithm: HashAlgorithm = "ckb-blake2b-256"
): boolean {
  const rawTxHasher = createHasher(hashAlgorithm);
  const tx = createTransactionFromSkeleton(rawTransaction);
  const txHash = rawTxHasher
    .update(
      RawTransaction.pack(
        pick(tx, [
          "cellDeps",
          "headerDeps",
          "inputs",
          "outputs",
          "outputsData",
          "version",
        ])
      )
    )
    .digest();

  const witnesses = extraData.map((it) => bytify(it));

  const inputGroups = groupInputs(rawTransaction.get("inputs"));
  for (const group of inputGroups) {
    const hasher = createHasher(hashAlgorithm);
    const firstIndex = group[0];
    const witness = witnesses.at(firstIndex);
    if (!witness) {
      continue;
    }

    const witnessArgs = WitnessArgs.unpack(witness);
    witnessArgs.lock = SECP_SIGNATURE_PLACEHOLDER;
    hasher.update(txHash);

    const witnessWithPlaceholder = WitnessArgs.pack(witnessArgs);

    const witnessLengthBuffer = getWitnessLength(witnessWithPlaceholder);

    hasher.update(witnessLengthBuffer);
    hasher.update(witnessWithPlaceholder);

    // Hash other inputs in same group
    for (const index of group.slice(1)) {
      const witness = witnesses.at(index);
      if (!witness) {
        throw new Error(`Witness not found in index ${index}`);
      }
      const witnessLengthBuffer = getWitnessLength(witness);
      hasher.update(witnessLengthBuffer);
      hasher.update(witness);
    }

    // Hash the witness which do not in any input group
    for (const witness of witnesses.slice(tx.inputs.length)) {
      const witnessLengthBuffer = getWitnessLength(witness);
      hasher.update(witnessLengthBuffer);
      hasher.update(witness);
    }

    const actual = hasher.digest();
    const message = messageForSigning.at(firstIndex);
    if (!message) {
      throw new Error(`Messages for signing not found in index ${firstIndex}`);
    }
    const expected = hexify(message);
    if (actual !== expected) {
      return false;
    }
  }

  return true;
}
