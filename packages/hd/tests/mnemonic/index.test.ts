import test from "ava";
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
} from "../../src/mnemonic/index";

const fixtures = require("./fixtures.json");

test("generate & validate mnemonic", (t) => {
  fixtures.vectors.map(
    async ({
      entropy,
      mnemonic,
    }: {
      entropy: string;
      mnemonic: string;
      seed: string;
    }) => {
      t.true(validateMnemonic(mnemonic));
      t.is(entropyToMnemonic("0x" + entropy), mnemonic);
      t.is(mnemonicToEntropy(mnemonic), "0x" + entropy);
    }
  );
});

test("generate seed", async (t) => {
  await Promise.all(
    fixtures.vectors.map(
      async ({
        mnemonic,
        seed,
      }: {
        entropy: string;
        mnemonic: string;
        seed: string;
      }) => {
        t.is(
          await mnemonicToSeed(mnemonic).then((s) => s.toString("hex")),
          seed
        );
        t.is(mnemonicToSeedSync(mnemonic).toString("hex"), seed);
      }
    )
  );
});
