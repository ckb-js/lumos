import { Address } from "@emurgo/cardano-serialization-lib-asmjs";
import React, { useEffect, useState } from "react";
import { capacityOf, CIP30FullAPI, CONFIG, detectCardano, transfer } from "./lib";
import { helpers, Script } from "@ckb-lumos/lumos";
import ReactDOM from "react-dom";

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [api, setAPI] = useState<CIP30FullAPI>();
  const [cardanoAddr, setCardanoAddr] = useState("");

  const [ckbAddr, setCkbAddr] = useState("");
  const [lock, setLock] = useState<Script>();
  const [balance, setBalance] = useState("-");

  const [transferAddr, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (window.location !== window.parent.location) {
      alert("Please open this example in a new window, as it does not support running in an iframe");
    }
  }, []);

  async function connectToNami() {
    const cardano = await detectCardano();
    cardano.nami
      .enable()
      .then((api) => {
        setAPI(api);
        return api.getUsedAddresses();
      })
      .then(([address]) => {
        setCardanoAddr(address);

        const cardanoLock: Script = {
          code_hash: CONFIG.SCRIPTS.CARDANO_LOCK.CODE_HASH,
          hash_type: CONFIG.SCRIPTS.CARDANO_LOCK.HASH_TYPE,
          args: address,
        };
        const ckbAddr = helpers.generateAddress(cardanoLock);
        setLock(cardanoLock);
        setCkbAddr(ckbAddr);

        return capacityOf(ckbAddr);
      })
      .then((capacity) => setBalance(capacity.div(10 ** 8).toString() + " CKB"));
  }

  function onTransfer() {
    if (isSendingTx) return;
    setIsSendingTx(true);

    transfer({ amount: transferAmount, from: ckbAddr, to: transferAddr, api: api!, cardanoAddr: cardanoAddr })
      .then(setTxHash)
      .catch((e) => alert(e.message || JSON.stringify(e)))
      .finally(() => setIsSendingTx(false));
  }

  if (!cardanoAddr) return <button onClick={connectToNami}>Connect to Nami</button>;

  return (
    <div>
      <ul>
        <li>Cardano Address: {Address.from_bytes(Buffer.from(cardanoAddr, "hex")).to_bech32()}</li>

        <li>Nervos Address: {ckbAddr}</li>
        <li>
          Current lock script:
          <pre>{JSON.stringify(lock, null, 2)}</pre>
        </li>

        <li>Balance: {balance}</li>
      </ul>

      <div>
        <h2>Transfer to</h2>
        <label htmlFor="address">Address</label>&nbsp;
        <input id="address" type="text" onChange={(e) => setTransferAddress(e.target.value)} placeholder="ckt1..." />
        <br />
        <label htmlFor="amount">Amount</label>
        &nbsp;
        <input id="amount" type="text" onChange={(e) => setTransferAmount(e.target.value)} placeholder="shannon" />
        <br />
        <button onClick={onTransfer} disabled={isSendingTx}>
          Transfer
        </button>
        <p>Tx Hash: {txHash}</p>
      </div>
    </div>
  );
}
