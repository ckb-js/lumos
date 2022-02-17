import { Address } from "@emurgo/cardano-serialization-lib-browser";
import React, { useEffect, useState } from "react";
import "./App.css";
import { CIP30FullAPI, detectCardano } from "./lib";

function useCardano() {
  const [cardano, setCardano] = useState<{ api: CIP30FullAPI; address: Address }>();

  useEffect(() => {
    (async () => {
      const cardano = await detectCardano();
      const api = await cardano.nami.enable();

      const [address] = await api.getUsedAddresses();

      setCardano({ api, address: Address.from_bytes(Buffer.from(address, "hex")) });
    })();
  }, []);

  return cardano;
}

function App() {
  const api = useCardano();

  if (!api) {
    return <div>Waiting for connect to NamiWallet</div>;
  }

  return (
    <div>
      <ul>
        <li>Cardano Address: {api.address.to_bech32()}</li>
      </ul>
    </div>
  );
}

export default App;
