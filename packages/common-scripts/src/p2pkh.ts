import {
  Cell,
  utils,
  Hash,
  Script,
  HexString,
  RawTransaction,
  blockchain,
} from "@ckb-lumos/base";
import {
  TransactionSkeletonType,
  createTransactionFromSkeleton,
} from "@ckb-lumos/helpers";
import { bytes } from "@ckb-lumos/codec";
import { BI } from "@ckb-lumos/bi";

function groupInputs(inputs: Cell[], locks: Script[]): Map<string, number[]> {
  const lockSet = new Set<string>();
  for (const lock of locks) {
    const scriptHash = utils.ckbHash(blockchain.Script.pack(lock));
    lockSet.add(scriptHash);
  }

  const groups = new Map<string, number[]>();
  for (let i = 0; i < inputs.length; i++) {
    const scriptHash = utils.ckbHash(
      blockchain.Script.pack(inputs[i].cellOutput.lock)
    );
    if (lockSet.has(scriptHash)) {
      if (groups.get(scriptHash) === undefined) groups.set(scriptHash, []);
      groups.get(scriptHash)!.push(i);
    }
  }
  return groups;
}

function calcRawTxHash(tx: TransactionSkeletonType): HexString {
  const createdTx = createTransactionFromSkeleton(tx);
  const rawTx: RawTransaction = {
    cellDeps: createdTx.cellDeps,
    headerDeps: createdTx.headerDeps,
    inputs: createdTx.inputs,
    outputs: createdTx.outputs,
    outputsData: createdTx.outputsData,
    version: createdTx.version,
  };
  return utils.ckbHash(blockchain.RawTransaction.pack(rawTx));
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

type ThunkOrValue<T> = T | (() => T);

interface Options {
  hasher?: ThunkOrValue<Hasher>;
}

const defaultCkbHasher: ThunkOrValue<Hasher> = () => {
  const hasher = new utils.CKBHasher();
  return {
    update: (message) => hasher.update(message.buffer),
    digest: () => bytes.bytify(hasher.digestHex()),
  };
};

function resolveThunk<T>(thunkOrValue: ThunkOrValue<T>): T {
  if (thunkOrValue instanceof Function) return thunkOrValue();
  return thunkOrValue;
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
  { hasher: thunkableHasher = defaultCkbHasher }: Options = {}
): Group[] {
  const groups = groupInputs(tx.inputs.toArray(), locks);
  const rawTxHash = calcRawTxHash(tx);

  if (locks.length > 1 && !(thunkableHasher instanceof Function)) {
    // If we have multiple locks to group, we need the hasher to be thunk so that in the second group we can get another new hasher.
    throw new Error(
      "Must provide hasher producer when you have multiple locks to group."
    );
  }

  const messageGroup: Group[] = [];

  for (const group of groups.keys()) {
    const messageHasher = resolveThunk(thunkableHasher);
    const indexes = groups.get(group)!;
    const firstIndex = indexes[0];
    const firstWitness = tx.witnesses.get(firstIndex);
    if (firstWitness === undefined) {
      throw new Error("Please fill witnesses with 0 first!");
    }
    messageHasher.update(bytes.bytify(rawTxHash));

    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    const witnessHexString = BI.from(
      bytes.bytify(firstWitness).length
    ).toString(16);
    if (witnessHexString.length <= 8) {
      view.setUint32(0, Number("0x" + witnessHexString), true);
      view.setUint32(4, Number("0x" + "00000000"), true);
    }

    if (witnessHexString.length > 8 && witnessHexString.length <= 16) {
      view.setUint32(0, Number("0x" + witnessHexString.slice(-8)), true);
      view.setUint32(4, Number("0x" + witnessHexString.slice(0, -8)), true);
    }

    messageHasher.update(new Uint8Array(lengthBuffer));
    messageHasher.update(bytes.bytify(firstWitness));

    for (let i = 1; i < indexes.length; i++) {
      const witness = tx.witnesses.get(indexes[i])!;
      messageHasher.update(new Uint8Array(lengthBuffer));
      messageHasher.update(bytes.bytify(witness));
    }

    for (
      let i = tx.inputs.toArray().length;
      i < tx.witnesses.toArray().length;
      i++
    ) {
      const witness = tx.witnesses.get(i)!;
      messageHasher.update(new Uint8Array(lengthBuffer));
      messageHasher.update(bytes.bytify(witness));
    }

    const digested = messageHasher.digest();
    const g: Group = {
      index: firstIndex,
      lock: tx.inputs.get(firstIndex)!.cellOutput.lock,
      message:
        "0x" +
        Array.prototype.map
          .call(digested, (x) => ("00" + x.toString(16)).slice(-2))
          .join(""),
    };

    messageGroup.push(g);
  }

  return messageGroup;
}
