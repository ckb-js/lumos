import React, { useEffect, useState } from "react";
import { helpers, Script } from "@ckb-lumos/lumos";
import ReactDOM from "react-dom";
import { asyncSleep, capacityOf, ethereum, genOmnilockScript, genOmnilockSuite, transfer } from "./lib2";
import { OmnilockSuite } from "@ckb-lumos/omnilock/lib/types";


const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [ethAddr, setEthAddr] = useState("");
  const [omniAddr, setOmniAddr] = useState("");
  const [omniLock, setOmniLock] = useState<Script>();
  const [suite, setSuite] = useState<OmnilockSuite>();
  const [balance, setBalance] = useState("-");

  const [transferAddr, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    asyncSleep(100).then(() => {
      if (ethereum.selectedAddress) connectToMetaMask();
      ethereum.addListener("accountsChanged", connectToMetaMask);
    });
  }, []);

  function connectToMetaMask() {
    ethereum
      .enable()
      .then(([ethAddr]: string[]) => {
        const suite = genOmnilockSuite(ethAddr)
        const omniLock: Script = genOmnilockScript(suite)
        const omniAddr = helpers.generateAddress(omniLock);
        
        setSuite(suite)
        setEthAddr(ethAddr);
        setOmniAddr(omniAddr);
        setOmniLock(omniLock);
        return omniAddr;
      })
      .then((omniAddr) => capacityOf(omniAddr))
      .then((balance) => setBalance(balance.div(10 ** 8).toString() + " CKB"));
  }

  function onTransfer() {
    if (isSendingTx) return;
    setIsSendingTx(true);

    transfer(suite, { amount: transferAmount, from: omniAddr, to: transferAddr })
      .then(setTxHash)
      .catch((e) => alert(e.message || JSON.stringify(e)))
      .finally(() => setIsSendingTx(false));
  }

  if (!ethereum) return <div>MetaMask is not installed</div>;
  if (!ethAddr) return <button onClick={connectToMetaMask}>Connect to MetaMask</button>;

  return (
    <div>
      <ul>
        <li>Ethereum Address: {ethAddr}</li>
        <li>Nervos Address(Omni): {omniAddr}</li>
        <li>
          Current Omni lock script:
          <pre>{JSON.stringify(omniLock, null, 2)}</pre>
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
