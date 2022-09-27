import test from "ava";
import * as hd from "@ckb-lumos/hd";
import { omnilock } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
import {
  isOmnilockAddress,
  prepareSigningEntries,
  SECP_SIGNATURE_PLACEHOLDER,
} from "../src/helper";
import { blockchain, Script } from "@ckb-lumos/base";
import {
  encodeToAddress,
  TransactionSkeleton,
  parseAddress,
} from "@ckb-lumos/helpers";
import { hexify } from "@ckb-lumos/codec/lib/bytes";

const { AGGRON4 } = predefined;
const emptyWitness = hexify(
  blockchain.WitnessArgs.pack({ lock: SECP_SIGNATURE_PLACEHOLDER })
);

test("should isOmnilockAddress return true if omnilock address provided", (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);
  const aliceOmnilock: Script = omnilock.createOmnilockScript(
    {
      auth: {
        flag: "SECP256K1_BLAKE160",
        content: aliceArgs,
      },
    },
    { config: AGGRON4 }
  );
  const result = isOmnilockAddress(
    encodeToAddress(aliceOmnilock, { config: AGGRON4 }),
    AGGRON4
  );
  t.is(result, true);
});

test("should isOmnilockAddress return false if other address provided", (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);
  // alice secp256 lock
  const aliceSecp256k1lock: Script = {
    codeHash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
    hashType: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
    args: aliceArgs,
  };
  const result = isOmnilockAddress(
    encodeToAddress(aliceSecp256k1lock, { config: AGGRON4 }),
    AGGRON4
  );
  t.is(result, false);
});

test("hashContentExceptRawTx in return value of `prepareSigningEntries` should be correct", (t) => {
  const lockScript = parseAddress(
    // just a random private key
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwjve3v8mthg2xplk5lapfzyhkmq3cyjcsnjj6g4",
    {
      config: AGGRON4,
    }
  );
  let txSkeleton = TransactionSkeleton()
    .update("inputs", (inputs) => {
      return inputs.push(
        {
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
        },
        {
          cellOutput: {
            capacity: "0x191981",
            lock: lockScript,
            type: undefined,
          },
          data: "0x",
          outPoint: {
            txHash:
              "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            index: "0x0",
          },
        }
      );
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
    .update("witnesses", (witnesses) =>
      witnesses.push(
        emptyWitness,
        emptyWitness,
        hexify(
          blockchain.WitnessArgs.pack({
            lock: SECP_SIGNATURE_PLACEHOLDER,
            inputType: "0xAADD",
            outputType: "0xDDDD",
          })
        )
      )
    );

  const tx = prepareSigningEntries(txSkeleton, AGGRON4, "SECP256K1_BLAKE160");

  t.is(
    hexify(tx.signingEntries.get(0)!.hashContentExceptRawTx),
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000550000001000000055000000550000004100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006100000010000000550000005b00000041000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000aadd02000000dddd"
  );
});
