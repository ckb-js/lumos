import { Cell, core, utils, toolkit, helpers } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { Reader } from "@ckb-lumos/toolkit";
import { Hash } from '@ckb-lumos/base';

function groupInputs(inputs: Cell[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (let i = 0; i < inputs.length; i++) {
    const scriptHash = utils.ckbHash(core.SerializeScript(inputs[i].cell_output.lock)).serializeJson();
    if (groups.get(scriptHash) === null) groups.set(scriptHash, []);
    groups.get(scriptHash)!.push(i);
  }
  return groups;
}

export function calcRawTxHash(tx: TransactionSkeletonType): Reader {
  return utils.ckbHash(
    core.SerializeRawTransaction(
      toolkit.normalizers.NormalizeRawTransaction(helpers.createTransactionFromSkeleton(tx))
    )
  );
}

export interface Hasher {
  update(message: string | Reader | ArrayBuffer | Buffer): void;
  digest(): Hash;
}

export function createP2PKHMessage(tx: TransactionSkeletonType, hasher?: Hasher): Map<number, Hash> {
  const groups = groupInputs(tx.inputs.toArray());
  const rawTxHash = calcRawTxHash(tx);

  const defaultHasher = new utils.CKBHasher();
  hasher = hasher || {
    update: (message) => defaultHasher.update(message),
    digest: () => defaultHasher.digestHex(),
  }

  const messageMap = new Map<number, Hash>();

  for (let group in groups.keys()) {
    const indexes = groups.get(group)!;
    const firstIndex = indexes[0];
    const serializedWitness = core.SerializeWitnessArgs({
      lock: new Reader("0x" + "00".repeat(65)),
    });

    hasher.update(Buffer.from(new Uint8Array(rawTxHash.toArrayBuffer())));

    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    view.setBigUint64(0, BigInt(new Reader(serializedWitness).length()), true);

    hasher.update(Buffer.from(new Uint8Array(lengthBuffer)));
    hasher.update(Buffer.from(new Uint8Array(serializedWitness)));

    for (let i = 1; i < indexes.length; i++) {
      const witness = tx.witnesses.get(i)!;
      hasher.update(Buffer.from(new Uint8Array(lengthBuffer)));
      hasher.update(witness);
    }

    for (let i = tx.inputs.toArray().length; i < tx.witnesses.toArray().length; i++) {
      const witness = tx.witnesses.get(i)!;
      hasher.update(Buffer.from(new Uint8Array(lengthBuffer)));
      hasher.update(witness);
    }

    messageMap.set(firstIndex, hasher.digest());
  }

  return messageMap;
}