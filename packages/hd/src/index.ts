import Keystore, {
  UnsupportedCipher,
  IncorrectPassword,
  InvalidKeystore,
  HexStringWithoutPrefix,
} from "./keystore";
import { XPubStore } from "./xpub_store";
import Keychain from "./keychain";
import {
  AddressType,
  ExtendedPublicKey,
  AccountExtendedPublicKey,
  ExtendedPrivateKey,
  PrivateKeyInfo,
  PublicKeyInfo,
} from "./extended_key";
import mnemonic from "./mnemonic";
import key from "./key";

export {
  mnemonic,
  Keystore,
  UnsupportedCipher,
  IncorrectPassword,
  InvalidKeystore,
  Keychain,
  AddressType,
  ExtendedPublicKey,
  AccountExtendedPublicKey,
  ExtendedPrivateKey,
  key,
  XPubStore,
};

export default {
  mnemonic,
  Keystore,
  UnsupportedCipher,
  IncorrectPassword,
  InvalidKeystore,
  Keychain,
  AddressType,
  ExtendedPublicKey,
  AccountExtendedPublicKey,
  ExtendedPrivateKey,
  key,
  XPubStore,
};

export type { HexStringWithoutPrefix, PrivateKeyInfo, PublicKeyInfo };
