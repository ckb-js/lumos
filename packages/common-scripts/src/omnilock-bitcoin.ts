import { bytes } from "@ckb-lumos/codec";
import { bech32 } from "bech32";
import bs58 from "bs58";

export function decodeAddress(address: string): ArrayLike<number> {
  try {
    // Bech32
    if (address.startsWith("bc1")) {
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
    if (address.startsWith("bc1")) {
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
  message: string,
  type?: "ecdsa",
  provider?: Provider
): Promise<string> {
  const internal: Provider = (() => {
    if (provider) return provider;

    /* c8 ignore next */
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
  const signatureBase64 = await internal.signMessage(
    message.startsWith("0x") ? message.slice(2) : message,
    type
  );
  const signature = bytes.bytify(base64ToHex(signatureBase64));

  const address = accounts[0];
  if (address.startsWith("bc1q")) {
    signature[0] = 39 + ((signature[0] - 27) % 4);
  }
  if (address.startsWith("3")) {
    signature[0] = 35 + ((signature[0] - 27) % 4);
  }
  if (address.startsWith("1")) {
    signature[0] = 31 + ((signature[0] - 27) % 4);
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
