import test from "ava";
import { helpers } from "@ckb-lumos/lumos";
import { predefined } from "@ckb-lumos/config-manager";
import {
  parseAddress,
  TransactionSkeletonInterface,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { common } from "@ckb-lumos/common-scripts";
import { SECP_SIGNATURE_PLACEHOLDER } from "@ckb-lumos/common-scripts/lib/helper";
import { blockchain } from "@ckb-lumos/base";
import { validateP2PKHMessage } from "../src/validate";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import { number, bytes } from "@ckb-lumos/codec";
import { createTransactionFromSkeleton } from "../src";

const { AGGRON4 } = predefined;

const emptyWitness = hexify(
  blockchain.WitnessArgs.pack({ lock: SECP_SIGNATURE_PLACEHOLDER })
);

function getMessageForSigning(
  signingEntries: TransactionSkeletonInterface["signingEntries"]
) {
  return signingEntries.get(0)!.message;
}

function getHashContentExpectRawTx(tx: TransactionSkeletonType) {
  const witness = tx.witnesses.get(0)!;
  const witnessLengthBuffer = number.Uint64.pack(bytify(witness).length).buffer;
  return bytes.concat(witnessLengthBuffer, witness);
}

function createTestRawTransaction() {
  let txSkeleton = helpers.TransactionSkeleton({});
  const lockScript = parseAddress(
    // just a random private key
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwjve3v8mthg2xplk5lapfzyhkmq3cyjcsnjj6g4",
    {
      config: AGGRON4,
    }
  );
  return txSkeleton
    .update("inputs", (inputs) => {
      return inputs.push({
        cellOutput: {
          capacity: "0x114514",
          lock: lockScript,
          type: undefined,
        },
        data: "0x",
        outPoint: {
          txHash:
            "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
          index: "0x0",
        },
      });
    })
    .update("outputs", (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: "0x114514",
          lock: lockScript,
          type: undefined,
        },

        data: "0x",
      });
    })
    .update("witnesses", (witnesses) => witnesses.push(emptyWitness));
}

test("simple", (t) => {
  let txSkeleton = createTestRawTransaction();

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.true(
    validateP2PKHMessage(
      getMessageForSigning(txSkeleton.signingEntries),
      createTransactionFromSkeleton(txSkeleton),
      getHashContentExpectRawTx(txSkeleton),
      "ckb-blake2b-256"
    )
  );

  t.false(
    validateP2PKHMessage(
      bytes.bytifyRawString("KFC CRAZY THURSDAY V ME 50"),
      createTransactionFromSkeleton(txSkeleton),
      getHashContentExpectRawTx(txSkeleton),
      "ckb-blake2b-256"
    )
  );
});

test("unknown hasher", (t) => {
  let txSkeleton = createTestRawTransaction();
  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });
  t.throws(() => {
    validateP2PKHMessage(
      getMessageForSigning(txSkeleton.signingEntries),
      createTransactionFromSkeleton(txSkeleton),
      getHashContentExpectRawTx(txSkeleton),
      "unknown" as any
    );
  });
});
