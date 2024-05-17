import { AccountExtendedPublicKey } from "./extended_key";

export class XPubStore {
  private accountExtendedPublicKey: AccountExtendedPublicKey;

  constructor(accountExtendedPublicKey: AccountExtendedPublicKey) {
    this.accountExtendedPublicKey = accountExtendedPublicKey;
  }

  toAccountExtendedPublicKey(): AccountExtendedPublicKey {
    return this.accountExtendedPublicKey;
  }

  toJson(): string {
    return JSON.stringify({
      xpubkey: this.accountExtendedPublicKey.serialize().slice(2),
    });
  }

  static fromJson(json: string): XPubStore {
    const xpub = JSON.parse(json).xpubkey;
    const accountExtendedPublicKey = AccountExtendedPublicKey.parse(
      "0x" + xpub
    );
    return new XPubStore(accountExtendedPublicKey);
  }
}
