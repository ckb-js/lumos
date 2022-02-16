// https://cips.cardano.org/cips/cip30/

export interface Cardano {
  nami: {
    enable: () => Promise<CIP30FullAPI>;
  };
}
export interface CIP30FullAPI {
  getUsedAddresses: () => Promise<string[]>;
  signData: (address: string, message: string) => Promise<string>;
}

declare global {
  interface Window {
    cardano: Cardano;
  }
}

export async function detectCardano(): Promise<Cardano> {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > 5000) {
      throw new Error("It seems you dont have NamiWallet installed");
    }
    if (window.cardano) return window.cardano;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
