import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { commons, helpers, Script } from "@ckb-lumos/lumos";
import { asyncSleep, capacityOf, ethereum, mintSudt } from "./lib";

function App() {
  const [ethAddr, setEthAddr] = useState("");
  const [omniAddr, setOmniAddr] = useState("");
  const [omniLock, setOmniLock] = useState<Script>();
  const [balance, setBalance] = useState("-");

  const [mintAddr, setMintAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("");

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
        const omniLockScript = commons.omnilock.createOmnilockScript({ auth: { flag: "ETHEREUM", content: ethAddr } });

        const omniAddr = helpers.encodeToAddress(omniLockScript);

        setEthAddr(ethAddr);
        setOmniAddr(omniAddr);
        setOmniLock(omniLockScript);

        return omniAddr;
      })
      .then((omniAddr) => capacityOf(omniAddr))
      .then((balance) => setBalance(balance.div(10 ** 8).toString() + " CKB"));
  }

  function onMint() {
    if (isSendingTx) return;
    setIsSendingTx(true);

    mintSudt({ amount: mintAmount, from: omniAddr, to: mintAddr })
      .then(setTxHash)
      .catch((e) => {
        console.log(e);
        alert(e.message || JSON.stringify(e));
      })
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
        <h2>Mint token to</h2>
        <label htmlFor="address">Address</label>&nbsp;
        <input id="address" type="text" onChange={(e) => setMintAddress(e.target.value)} placeholder="ckt1..." />
        <br />
        <label htmlFor="amount">Amount</label>
        &nbsp;
        <input id="amount" type="text" onChange={(e) => setMintAmount(e.target.value)} placeholder="shannon" />
        <br />
        <button onClick={onMint} disabled={isSendingTx}>
          Mint
        </button>
        <p>Tx Hash: {txHash}</p>
      </div>
    </div>
  );
}

const app = document.getElementById("root");
ReactDOM.render(<App />, app);
