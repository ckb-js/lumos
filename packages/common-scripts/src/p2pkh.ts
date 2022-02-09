import { Cell, core, utils, toolkit, helpers } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { Reader } from "@ckb-lumos/toolkit";
import { Hash, Script } from "@ckb-lumos/base";

function groupInputs(inputs: Cell[], locks: Script[]): Map<string, number[]> {
  const lockSet = new Set<string>();
  for (const lock of locks) {
    const scriptHash = utils
      .ckbHash(core.SerializeScript(toolkit.normalizers.NormalizeScript(lock)))
      .serializeJson();
    lockSet.add(scriptHash);
  }

  const groups = new Map<string, number[]>();
  for (let i = 0; i < inputs.length; i++) {
    const scriptHash = utils
      .ckbHash(
        core.SerializeScript(
          toolkit.normalizers.NormalizeScript(inputs[i].cell_output.lock)
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

export function calcRawTxHash(tx: TransactionSkeletonType): Reader {
  return utils.ckbHash(
    core.SerializeRawTransaction(
      toolkit.normalizers.NormalizeRawTransaction(
        helpers.createTransactionFromSkeleton(tx)
      )
    )
  );
}

export interface Hasher {
  update(message: string | ArrayBuffer | Buffer): void;
  digest(): Hash;
}

type Group = {
  index: number;
  lock: Script;
  message: Hash;
};

export function createP2PKHMessageGroup(
  tx: TransactionSkeletonType,
  locks: Script[],
  hasher?: Hasher
): Group[] {
  const groups = groupInputs(tx.inputs.toArray(), locks);
  const rawTxHash = calcRawTxHash(tx);

  const defaultHasher = new utils.CKBHasher();
  hasher = hasher || {
    update: (message) => defaultHasher.update(message),
    digest: () => defaultHasher.digestHex(),
  };

  const messageGroup: Group[] = [];

  for (const group of groups.keys()) {
    const indexes = groups.get(group)!;
    const firstIndex = indexes[0];
    const firstWitness = tx.witnesses.get(firstIndex);
    console.log(firstWitness);

    hasher.update(rawTxHash.toArrayBuffer());

    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    view.setBigUint64(0, BigInt(new Reader(firstWitness!).length()), true);

    hasher.update(lengthBuffer);
    hasher.update(firstWitness!);

    for (let i = 1; i < indexes.length; i++) {
      const witness = tx.witnesses.get(i)!;
      hasher.update(lengthBuffer);
      hasher.update(witness);
    }

    for (
      let i = tx.inputs.toArray().length;
      i < tx.witnesses.toArray().length;
      i++
    ) {
      const witness = tx.witnesses.get(i)!;
      hasher.update(lengthBuffer);
      hasher.update(witness);
    }

    const g: Group = {
      index: firstIndex,
      lock: tx.inputs.get(firstIndex)!.cell_output.lock,
      message: hasher.digest(),
    };

    messageGroup.push(g);
  }

  return messageGroup;
}
