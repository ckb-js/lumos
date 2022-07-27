import { AccountExtendedPublicKey } from "./extended_key";
import fs from "fs";

export class XPubStore {
  private accountExtendedPublicKey: AccountExtendedPublicKey;

  constructor(accountExtendedPublicKey: AccountExtendedPublicKey) {
    this.accountExtendedPublicKey = accountExtendedPublicKey;
  }

  toAccountExtendedPublicKey(): AccountExtendedPublicKey {
    return this.accountExtendedPublicKey;
  }

  save(
    path: string,
    {
      overwrite = false,
    }: {
      overwrite?: boolean;
    } = {}
  ) {
    if (!overwrite && fs.existsSync(path)) {
      throw new Error("XPub file already exists!");
    }
    fs.writeFileSync(path, this.toJson());
  }

  toJson(): string {
    return JSON.stringify({
      xpubkey: this.accountExtendedPublicKey.serialize().slice(2),
    });
  }

  static load(path: string): XPubStore {
    const json = fs.readFileSync(path, "utf-8");
    const xpub = JSON.parse(json).xpubkey;
    const accountExtendedPublicKey = AccountExtendedPublicKey.parse(
      "0x" + xpub
    );
    return new XPubStore(accountExtendedPublicKey);
  }
}
