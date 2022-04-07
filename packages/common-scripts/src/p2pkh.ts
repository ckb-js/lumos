import { Cell, core, utils, Hash, Script } from "@ckb-lumos/base";
import {
  TransactionSkeletonType,
  createTransactionFromSkeleton,
} from "@ckb-lumos/helpers";
import { Reader, normalizers } from "@ckb-lumos/toolkit";
import { BI } from "@ckb-lumos/bi";

function groupInputs(inputs: Cell[], locks: Script[]): Map<string, number[]> {
  const lockSet = new Set<string>();
  for (const lock of locks) {
    const scriptHash = utils
      .ckbHash(core.SerializeScript(normalizers.NormalizeScript(lock)))
      .serializeJson();
    lockSet.add(scriptHash);
  }

  const groups = new Map<string, number[]>();
  for (let i = 0; i < inputs.length; i++) {
    const scriptHash = utils
      .ckbHash(
        core.SerializeScript(
          normalizers.NormalizeScript(inputs[i].cell_output.lock)
        )
      )
      .serializeJson();
    if (lockSet.has(scriptHash)) {
      if (groups.get(scriptHash) === undefined) groups.set(scriptHash, []);
      groups.get(scriptHash)!.push(i);
    }
  }
  return groups;
}

function calcRawTxHash(tx: TransactionSkeletonType): Reader {
  return utils.ckbHash(
    core.SerializeRawTransaction(
      normalizers.NormalizeRawTransaction(createTransactionFromSkeleton(tx))
    )
  );
}

export interface Hasher {
  update(message: Uint8Array): void;
  digest(): Uint8Array;
}

type Group = {
  index: number;
  lock: Script;
  message: Hash;
};

interface Options {
  hasher?: Hasher;
}

/**
 * Return an array of messages as well as their corresponding position indexes and locks for signing a P2PKH transaction.
 * For more details, please see:
 * https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction
 *
 * @param tx TxSkeleton with all input cells' witnessArgs.lock filled with 0.
 * @param locks Locks you want to sign, e.g. you don't need to sign ACP cells.
 * @param hasher Message hasher, defaults to CKB blake2b hasher. Check
 * https://github.com/nervosnetwork/ckb-system-scripts/blob/e975e8b7d5231fdb1c537b830dd934b305492417/c/secp256k1_blake160_sighash_all.c#L22-L28 for more.
 * @returns An array of Group containing: lock of the input cell you need to sign, message for signing, witness index of this message (first index of the input cell with this lock).
 */
export function createP2PKHMessageGroup(
  tx: TransactionSkeletonType,
  locks: Script[],
  { hasher = undefined }: Options = {}
): Group[] {
  const groups = groupInputs(tx.inputs.toArray(), locks);
  const rawTxHash = calcRawTxHash(tx);

  const defaultHasher = new utils.CKBHasher();
  hasher = hasher || {
    update: (message) => defaultHasher.update(message.buffer),
    digest: () => new Uint8Array(defaultHasher.digestReader().toArrayBuffer()),
  };

  const messageGroup: Group[] = [];

  for (const group of groups.keys()) {
    const indexes = groups.get(group)!;
    const firstIndex = indexes[0];
    const firstWitness = tx.witnesses.get(firstIndex);
    if (firstWitness === undefined) {
      throw new Error("Please fill witnesses with 0 first!");
    }

    hasher.update(new Uint8Array(rawTxHash.toArrayBuffer()));

    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    const witnessHexString = BI.from(
      new Reader(firstWitness).length()
    ).toString(16);
    if (witnessHexString.length <= 8) {
      view.setUint32(0, Number("0x" + witnessHexString), true);
      view.setUint32(4, Number("0x" + "00000000"), true);
    }

    if (witnessHexString.length > 8 && witnessHexString.length <= 16) {
      view.setUint32(0, Number("0x" + witnessHexString.slice(-8)), true);
      view.setUint32(4, Number("0x" + witnessHexString.slice(0, -8)), true);
    }

    hasher.update(new Uint8Array(lengthBuffer));
    hasher.update(new Uint8Array(new Reader(firstWitness).toArrayBuffer()));

    for (let i = 1; i < indexes.length; i++) {
      const witness = tx.witnesses.get(indexes[i])!;
      hasher.update(new Uint8Array(lengthBuffer));
      hasher.update(new Uint8Array(new Reader(witness).toArrayBuffer()));
    }

    for (
      let i = tx.inputs.toArray().length;
      i < tx.witnesses.toArray().length;
      i++
    ) {
      const witness = tx.witnesses.get(i)!;
      hasher.update(new Uint8Array(lengthBuffer));
      hasher.update(new Uint8Array(new Reader(witness).toArrayBuffer()));
    }

    const g: Group = {
      index: firstIndex,
      lock: tx.inputs.get(firstIndex)!.cell_output.lock,
      message:
        "0x" +
        Array.prototype.map
          .call(hasher.digest(), (x) => ("00" + x.toString(16)).slice(-2))
          .join(""),
    };

    messageGroup.push(g);
  }

  return messageGroup;
}
