import { BytesLike, bytes } from "@ckb-lumos/codec";

// https://github.com/XuJiandong/omnilock/blob/5c25d6a1a48f7d5984170aa501d5567281ba1a4c/c/ckb_identity.h#L36
const COMMON_PREFIX = "CKB transaction: 0x";

export interface PublicKey {
  toBase58(): string;
  toBytes(): Uint8Array;
}

export interface Provider {
  connect(): Promise<{ publicKey: PublicKey }>;
  signMessage(
    message: Uint8Array
  ): Promise<{ signature: Uint8Array; publicKey: PublicKey }>;
}

declare global {
  interface Window {
    phantom?: {
      solana: Provider;
    };
  }
}

export async function signMessage(
  digest: BytesLike,
  provider?: Provider
): Promise<string> {
  const internal: Provider = (() => {
    if (provider) return provider;

    /* c8 ignore start */
    if (
      typeof window !== "undefined" &&
      "phantom" in window &&
      window.phantom &&
      "solana" in window.phantom
    ) {
      return window.phantom.solana;
    }

    throw new Error(
      "No provider found, make sure you have installed Phantom or other Solana wallet"
    );
    /* c8 ignore stop */
  })();

  // '0x'.length
  const hexPrefixLength = 2;
  const digestWithout0x = bytes.hexify(digest).slice(hexPrefixLength);
  const signed = await internal.signMessage(
    new TextEncoder().encode(`${COMMON_PREFIX}${digestWithout0x}`)
  );

  return bytes.hexify(
    bytes.concat(signed.signature, signed.publicKey.toBytes())
  );
}
