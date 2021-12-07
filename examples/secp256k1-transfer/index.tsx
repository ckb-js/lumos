import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Script } from "@ckb-lumos/lumos";
import { capacityOf, generateAccountFromPrivateKey, transfer } from "./lib";

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [privKey, setPrivKey] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [fromLock, setFromLock] = useState<Script>();
  const [balance, setBalance] = useState("0");

  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const updateFromInfo = async () => {
      const { lockScript, address } = generateAccountFromPrivateKey(privKey);
      const capacity = await capacityOf(address);
      setFromAddr(address);
      setFromLock(lockScript);
      setBalance(capacity.toString());
    };

    if (privKey) {
      updateFromInfo();
    }
  }, [privKey]);

  return (
    <div>
      <label htmlFor="private-key">Private Key: </label>&nbsp;
      <input
        id="private-key"
        type="text"
        onChange={(e) => setPrivKey(e.target.value)}
      />
      <ul>
        <li>CKB Address: {fromAddr}</li>
        <li>
          Current lock script:
          <pre>{JSON.stringify(fromLock, null, 2)}</pre>
        </li>

        <li>Total capacity: {balance}</li>
      </ul>
      <label htmlFor="to-address">Transfer to Address: </label>&nbsp;
      <input
        id="to-address"
        type="text"
        onChange={(e) => setToAddr(e.target.value)}
      />
      <br />
      <label htmlFor="amount">Amount</label>
      &nbsp;
      <input
        id="amount"
        type="text"
        onChange={(e) => setAmount(e.target.value)}
      />
      <br />
      <button
        onClick={() =>
          transfer({ amount, from: fromAddr, to: toAddr, privKey })
        }
      >
        Transfer
      </button>
    </div>
  );
}
