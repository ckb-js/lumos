import {
  createTransactionFromSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { Message, WitnessLayout } from "./codec";
import { bytes, BytesLike, PackParam } from "@ckb-lumos/codec";
import {
  blockchain,
  Hash,
  Script,
  Transaction,
  WitnessArgs,
} from "@ckb-lumos/base";
import { ckbHash, computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { blake2bSighashAll, blake2bSighashAllOnly } from "./hash";
import { Uint32LE } from "@ckb-lumos/codec/lib/number";

/**
 * prepare the signing entries for cobuild locks
 *
 * @example
 *
 * prepareCobuildSighashSigningEntries(
 *   txSkeleton,
 *   (script) => script.codeHash === CODE_HASH_THAT_IS_COMPATIBLE_WITH_COBUILD,
 *   { actions: [cobuildAction0, cobuildAction1] }
 * )
 *
 * @param txSkeleton
 * @param sighashAllLockFilter a filter for locks that require sign with cobuild mode
 * @param message
 */
export function prepareCobuildSighashSigningEntries(
  txSkeleton: TransactionSkeletonType,
  sighashAllLockFilter: (script: Script) => boolean,
  message?: PackParam<typeof Message>
): TransactionSkeletonType {
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = ckbHash(blockchain.RawTransaction.pack(tx));

  const resolvedInputs = txSkeleton.inputs.map((input) =>
    bytes.concat(
      blockchain.CellOutput.pack(input.cellOutput),
      Uint32LE.pack(bytes.bytify(input.data).length),
      input.data
    )
  );
  const extraWitnesses = txSkeleton
    .get("witnesses")
    .slice(txSkeleton.inputs.size);

  const signingMessage = bytes.concat(
    message ? Message.pack(message) : [],
    txHash,
    ...resolvedInputs,
    ...extraWitnesses
  );
  const hashFn = message ? blake2bSighashAll : blake2bSighashAllOnly;
  const digest = bytes.hexify(hashFn(signingMessage));

  type SigningEntry = { type: string; index: number; message: string };
  const signingGroup: Map<Hash, SigningEntry> = new Map();

  txSkeleton.inputs.forEach((cell, index) => {
    const lockHash = computeScriptHash(cell.cellOutput.lock);

    if (
      signingGroup.has(lockHash) ||
      !sighashAllLockFilter(cell.cellOutput.lock)
    ) {
      return;
    }

    // remove already existed signingEntries to avoid unnecessary signing entries
    txSkeleton = txSkeleton.update("signingEntries", (signingEntries) =>
      signingEntries.filter(({ index: existsIndex }) => existsIndex !== index)
    );

    signingGroup.set(lockHash, {
      type: "witness_layout_lock",
      index: index,
      message: digest,
    });
  });

  return txSkeleton.update("signingEntries", (signingEntries) =>
    signingEntries
      .push(...Array.from(signingGroup.values()))
      .sortBy((item) => item.index)
  );
}

/**
 * seal a TransactionSkeleton that is compatible with both cobuild(WitnessLayout) or legacy(WitnessArgs) mode
 * @example
 *
 * sealTransaction
 *
 * @param txSkeleton
 * @param sealingContents
 * @param message In addition to the SighashAll variant, there is a special SighashAllOnly variant of WitnessLayout. This variant only contains seal, not message. If all witnesses in a transaction are of the SighashAllOnly type, it means that this transaction does not contain any Message.
 */
export function sealTransaction(
  txSkeleton: TransactionSkeletonType,
  sealingContents: BytesLike[],
  message?: PackParam<typeof Message>
): Transaction {
  const tx = createTransactionFromSkeleton(txSkeleton);
  const signingEntries = txSkeleton.get("signingEntries");
  if (sealingContents.length !== signingEntries.size) {
    throw new Error(
      `Requiring ${signingEntries.size} sealing contents but provided ${sealingContents.length}!`
    );
  }

  // In a CoBuild transaction, only one witness can use SighashAll format containing Message.
  // For transactions that require signatures from multiple different locks,
  // only one lock’s corresponding witness can use SighashAll format with Message included;
  // other lock’s corresponding witnesses should use SighashAllOnly format that contains only signature.
  let sighashAllHasBeenSet = false;

  signingEntries.forEach((e, i) => {
    switch (e.type) {
      case "witness_args_lock": {
        const witness = bytes.bytify(tx.witnesses[e.index]);
        const witnessArgs = blockchain.WitnessArgs.unpack(witness);
        const newWitnessArgs: WitnessArgs = {
          lock: bytes.hexify(sealingContents[i]),
        };
        const inputType = witnessArgs.inputType;
        if (inputType) {
          newWitnessArgs.inputType = inputType;
        }
        const outputType = witnessArgs.outputType;
        if (outputType) {
          newWitnessArgs.outputType = outputType;
        }

        tx.witnesses[e.index] = bytes.hexify(
          blockchain.WitnessArgs.pack(newWitnessArgs)
        );
        break;
      }
      case "witness_layout_lock": {
        const witnessLayout: Uint8Array =
          // SighashAll only required when the message is not empty,
          // and only on SighashAll can be included in a transaction
          !sighashAllHasBeenSet && message
            ? WitnessLayout.pack({
                type: "SighashAll",
                value: { message, seal: sealingContents[i] },
              })
            : WitnessLayout.pack({
                type: "SighashAllOnly",
                value: { seal: bytes.concat(sealingContents[i]) },
              });

        sighashAllHasBeenSet = true;
        tx.witnesses[e.index] = bytes.hexify(witnessLayout);
        break;
      }

      default:
        throw new Error(`Invalid signing entry: ${e.type}`);
    }
  });

  return tx;
}
