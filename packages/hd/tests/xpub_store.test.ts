import test from "ava";
import { XPubStore, AccountExtendedPublicKey } from "../src";
import fs from "fs";

// const mnemonic = "tank planet champion pottery together intact quick police asset flower sudden question";

const accountExtendedPublicKey = new AccountExtendedPublicKey(
  "0x03d8fc68aa9ddd16fa5449f13441366a814ef4a5246f54df9bc070e77106b75e34",
  "0xbe7dabec2733a2f8d9820ce2ae2d17a2f7abde3d0af79a54dbb1fbe5a652b52d"
);

const filePath = __dirname + "/fixtures/xpub.json";

test("load", (t) => {
  const xpub = XPubStore.load(filePath);
  const a = xpub.toAccountExtendedPublicKey();

  t.is(a.publicKey, accountExtendedPublicKey.publicKey);

  t.is(a.chainCode, accountExtendedPublicKey.chainCode);
});

test("toJson", (t) => {
  const xpub = new XPubStore(accountExtendedPublicKey);

  const json = fs.readFileSync(filePath, "utf-8");

  t.is(xpub.toJson(), JSON.stringify(JSON.parse(json)));
});
