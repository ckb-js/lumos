import { BytesLike } from "@ckb-lumos/codec";
import { HexString } from "@ckb-lumos/base";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";

interface EthereumRpc {
  (payload: {
    readonly method: "personal_sign";
    readonly params: [string /*from*/, string /*message*/];
  }): Promise<string>;

  (payload: { readonly method: "eth_accounts" }): Promise<string[]>;
}

export interface EthereumProvider {
  request: EthereumRpc;
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}

export type SignViaEthereumOptions = {
  /**
   * an ethereum provider, defaults to `window.ethereum`
   */
  provider?: EthereumProvider;
};

/**
 * @param message message for signing
 * @param options
 */
export async function signViaEthereum(
  message: BytesLike,
  options?: SignViaEthereumOptions
): Promise<HexString> {
  const provider = options?.provider ?? window.ethereum;
  if (!provider) {
    throw new Error(
      "No ethereum provider found, please run in an ethereum enabled browser"
    );
  }

  const accounts = await provider.request({ method: "eth_accounts" });
  if (!accounts || !accounts.length) {
    throw new Error("No ethereum account found");
  }

  let signedMessage = await provider.request({
    method: "personal_sign",
    params: [accounts[0], hexify(bytify(message))],
  });

  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage =
    "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");

  return signedMessage;
}
