import { bytes, BytesLike } from "@ckb-lumos/codec";
import { bech32 } from "bech32";
import bs58 from "bs58";

// https://github.com/XuJiandong/ckb-production-scripts/blob/f884d97963ad553b91bfcc992f68d1ad90f9b244/c/ckb_identity.h#L28
const BTC_PREFIX = "CKB (Bitcoin Layer-2) transaction: 0x";

/**
 * Decode bitcoin address to public key hash in bytes
 * @see https://en.bitcoin.it/wiki/List_of_address_prefixes
 * @param address
 */
export function decodeAddress(address: string): ArrayLike<number> {
  try {
    // Bech32
    if (address.startsWith("bc1q")) {
      return bech32.fromWords(bech32.decode(address).words.slice(1));
    }

    // P2PKH
    if (address.startsWith("1")) {
      return bs58.decode(address).slice(1, 21);
    }

    // P2SH
    if (address.startsWith("3")) {
      return bs58.decode(address).slice(1, 21);
    }
  } catch {
    // https://bitcoin.design/guide/glossary/address/#taproot-address---p2tr
    if (address.startsWith("bc1q")) {
      throw new Error("Taproot address is not supported yet.");
    }
  }

  throw new Error(
    `Unsupported bitcoin address ${address}, only 1...(P2PKH) 3...(P2SH), and bc1...(Bech32) are supported.`
  );
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
  // a secp256k1 private key can be used to sign various types of messages
  // the first byte of signature used as a recovery id to identify the type of message
  // https://github.com/XuJiandong/omnilock/blob/4e9fdb6ca78637651c8145bb7c5b82b4591332fb/c/ckb_identity.h#L249-L266
  if (address.startsWith("bc1q")) {
    signature[0] = 39 + ((signature[0] - 27) % 4);
  } else if (address.startsWith("3")) {
    signature[0] = 35 + ((signature[0] - 27) % 4);
  } else if (address.startsWith("1")) {
    signature[0] = 31 + ((signature[0] - 27) % 4);
  } else {
    throw new Error(
      `Unsupported bitcoin address ${address}, only 1...(P2PKH) 3...(P2SH), and bc1...(Bech32) are supported.`
    );
  }

  return bytes.hexify(signature);
}

function base64ToHex(str: string) {
  const raw = atob(str);
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : "0" + hex;
  }
  return "0x" + result;
}
