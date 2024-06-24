import { BytesLike, bytes } from "@ckb-lumos/codec";
import { hexify } from "@ckb-lumos/codec/lib/bytes";

const COMMON_PREFIX = "CKB transaction: 0x";

export interface Provider {
  request: {
    (payload: {
      method: "personal_sign";
      params: [from: string, message: string];
    }): Promise<string>;
  };
}

export async function signMessage(
  address: string,
  digest: BytesLike,
  provider?: Provider
): Promise<string> {
  /* c8 ignore start */
  const internal: Provider | undefined =
    provider ?? (globalThis as { ethereum?: Provider }).ethereum;

  if (!internal) {
    throw new Error(
      "No provider found, make sure you have installed MetaMask or the other EIP1193 compatible wallet"
    );
  }
  /* c8 ignore end */

  const sig = await internal.request({
    method: "personal_sign",
    params: [address, `${COMMON_PREFIX}${hexify(digest).slice(2)}`],
  });

  const signature = bytes.bytify(sig);

  const [tweakedV] = signature.slice(-1);
  // https://eips.ethereum.org/EIPS/eip-155
  const PARITY_FLAG = 27;
  const v = tweakedV >= PARITY_FLAG ? tweakedV - PARITY_FLAG : tweakedV;
  signature.set([v], signature.length - 1);
  return bytes.hexify(signature);
}
