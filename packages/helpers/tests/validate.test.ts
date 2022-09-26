import test from "ava";
import { helpers } from "@ckb-lumos/lumos";
import { predefined } from "@ckb-lumos/config-manager";
import { parseAddress, TransactionSkeletonInterface } from "@ckb-lumos/helpers";
import { common } from "@ckb-lumos/common-scripts";
import { SECP_SIGNATURE_PLACEHOLDER } from "@ckb-lumos/common-scripts/lib/helper";
import { blockchain } from "@ckb-lumos/base";
import { validateTransaction } from "../src/validate";
import { hexify } from "@ckb-lumos/codec/lib/bytes";

const { AGGRON4 } = predefined;

const emptyWitness = hexify(
  blockchain.WitnessArgs.pack({ lock: SECP_SIGNATURE_PLACEHOLDER })
);

function getMessageForSigning(
  signingEntries: TransactionSkeletonInterface["signingEntries"]
) {
  return signingEntries.map((it) => it.message).toArray();
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
    validateTransaction(
      getMessageForSigning(txSkeleton.signingEntries),
      txSkeleton,
      txSkeleton.get("witnesses").toArray(),
      "ckb-blake2b-256"
    )
  );

  t.false(
    validateTransaction(
      [
        new Uint8Array(
          "KFC CRAZY THURSDAY V ME 50".split("").map((it) => it.charCodeAt(0))
        ),
      ],
      txSkeleton,
      txSkeleton.get("witnesses").toArray(),
      "ckb-blake2b-256"
    )
  );
});

test("not enough extraData", (t) => {
  let txSkeleton = createTestRawTransaction();
  txSkeleton = common.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });
  t.throws(() => {
    validateTransaction(
      getMessageForSigning(txSkeleton.signingEntries),
      txSkeleton,
      [],
      "ckb-blake2b-256"
    );
  });
});

test("multiple source input locks", (t) => {
  const lockScript = parseAddress(
    // just an another private key
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwgr55hchmr4jgarqrf6qaxxvnwqtgtexck4783d",
    {
      config: AGGRON4,
    }
  );

  let txSkeleton = createTestRawTransaction();
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push({
      cellOutput: {
        capacity: "0x1919810",
        lock: lockScript,
        type: undefined,
      },
      data: "0x",
      outPoint: {
        txHash:
          "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
        index: "0x1",
      },
    });
  });

  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.push(emptyWitness)
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.assert(
    validateTransaction(
      getMessageForSigning(txSkeleton.signingEntries),
      txSkeleton,

      // TODO: now we get it from witness
      // when https://github.com/ckb-js/lumos/issues/430 implemented,
      // we should get it from txSkeleton.signingEntries[number].witnessInput
      txSkeleton.get("witnesses").toArray(),
      "ckb-blake2b-256"
    )
  );
});

test("unknown hasher", (t) => {
  let txSkeleton = createTestRawTransaction();
  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });
  t.throws(() => {
    validateTransaction(
      getMessageForSigning(txSkeleton.signingEntries),
      txSkeleton,
      txSkeleton.get("witnesses").toArray(),
      "unknown" as any
    );
  });
});
