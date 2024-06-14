import { bytes, BytesLike } from "@ckb-lumos/codec";
import { bech32 } from "bech32";
import bs58 from "bs58";

export type SupportedBtcAddressType = "P2SH-P2WPKH" | "P2WPKH" | "P2PKH";

// https://github.com/cryptape/omnilock/blob/9419b7795641da0ade25a04127e25d8a0b709077/c/ckb_identity.h#L28
const BTC_PREFIX = "CKB (Bitcoin Layer) transaction: 0x";

/**
 * Decode bitcoin address to public key hash in bytes
 * @see https://en.bitcoin.it/wiki/List_of_address_prefixes
 * @param address
 * @param allows
 */
export function decodeAddress(
  address: string,
  allows: SupportedBtcAddressType[] = ["P2WPKH", "P2PKH"]
): ArrayLike<number> {
  const btcAddressFlagSize = 1;
  const hashSize = 20;

  if (isP2wpkhAddress(address)) {
    assertAddressType(allows, "P2WPKH");
    return bech32.fromWords(bech32.decode(address).words.slice(1));
  }

  if (isP2pkhAddress(address)) {
    assertAddressType(allows, "P2PKH");
    return bs58
      .decode(address)
      .slice(btcAddressFlagSize, btcAddressFlagSize + hashSize);
  }

  if (isP2shAddress(address)) {
    assertAddressType(allows, "P2SH-P2WPKH");
    return bs58
      .decode(address)
      .slice(btcAddressFlagSize, btcAddressFlagSize + hashSize);
  }

  // https://bitcoin.design/guide/glossary/address/#taproot-address---p2tr
  if (address.startsWith("bc1p")) {
    throw new Error("Taproot address is not supported yet.");
  }

  throw new Error(
    "Unsupported address: " +
      address +
      "Only Native SegWit(P2WPKH) and Legacy(P2PKH) addresses are supported"
  );
}

function assertAddressType(
  allows: SupportedBtcAddressType[],
  usingAddressType: SupportedBtcAddressType
): void {
  if (!allows.includes(usingAddressType)) {
    throw new Error(
      `'${usingAddressType}' must be included in the 'allows' for the address`
    );
  }
}

export interface Provider {
  requestAccounts(): Promise<string[]>;
  signMessage(message: string, type?: "ecdsa"): Promise<string>;
}

export async function signMessage(
  digest: BytesLike,
  type?: "ecdsa",
  provider?: Provider
): Promise<string> {
  const internal: Provider = (() => {
    if (provider) return provider;

    /* c8 ignore next 15*/
    if (typeof window !== "undefined") {
      if ("unisat" in window) {
        return window.unisat as Provider;
      }

      if (
        "okxwallet" in window &&
        "bitcoin" in (window.okxwallet as Provider)
      ) {
        return (window.okxwallet as Record<"bitcoin", Provider>).bitcoin;
      }
    }

    throw new Error(
      "No provider found, make sure you have installed UniSat Wallet"
    );
  })();

  const accounts = await internal.requestAccounts();
  const digestWithout0x = bytes.hexify(digest).slice(2);
  const signatureBase64 = await internal.signMessage(
    `${BTC_PREFIX}${digestWithout0x}`,
    type
  );
  const signature = bytes.bytify(base64ToHex(signatureBase64));

  const address = accounts[0];
  /* eslint-disable @typescript-eslint/no-magic-numbers */

  // a secp256k1 private key can be used to sign various types of messages
  // the first byte of signature used as a recovery id to identify the type of message
  // https://github.com/XuJiandong/omnilock/blob/4e9fdb6ca78637651c8145bb7c5b82b4591332fb/c/ckb_identity.h#L249-L266
  if (isP2wpkhAddress(address)) {
    signature[0] = 39 + ((signature[0] - 27) % 4);
  } else if (isP2shAddress(address)) {
    signature[0] = 35 + ((signature[0] - 27) % 4);
  } else if (isP2pkhAddress(address)) {
    signature[0] = 31 + ((signature[0] - 27) % 4);
  } else {
    throw new Error(
      `Unsupported bitcoin address ${address}. Only supports SegWit, P2SH-P2WPKH, P2PKH`
    );
  }

  /* eslint-enable @typescript-eslint/no-magic-numbers */

  return bytes.hexify(signature);
}

function base64ToHex(str: string) {
  const raw = atob(str);
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    result += raw.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + result;
}

/* https://en.bitcoin.it/wiki/List_of_address_prefixes */

function isP2wpkhAddress(address: string): boolean {
  return (
    address.startsWith("bc1") || // mainnet
    address.startsWith("tb1") // testnet
  );
}

function isP2shAddress(address: string): boolean {
  return (
    address.startsWith("3") || // mainnet
    address.startsWith("2") // testnet
  );
}

function isP2pkhAddress(address: string): boolean {
  return (
    address.startsWith("1") || // mainnet
    address.startsWith("m") || // testnet
    address.startsWith("n") // testnet
  );
}
