import React, { useEffect, useState } from "react";
import { helpers, Script } from "@ckb-lumos/lumos";
import ReactDOM from "react-dom";
import { asyncSleep, ethereum, CONFIG, capacityOf, transfer } from "./lib";

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [ethAddr, setEthAddr] = useState("");
  const [omniAddr, setOmniAddr] = useState("");
  const [omniLock, setOmniLock] = useState<Script>();
  const [balance, setBalance] = useState("0");

  const [transferAddr, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  useEffect(function setupAddress() {
    if (!ethereum || ethAddr) return;

    // sleep 100ms to wait for metamask to be ready
    asyncSleep(100)
      .then(() => ethereum.enable())
      .then(([ethAddr]: string[]) => {
        const omniLock: Script = {
          code_hash: CONFIG.SCRIPTS.OMNI_LOCK.CODE_HASH,
          hash_type: CONFIG.SCRIPTS.OMNI_LOCK.HASH_TYPE,
          // omni flag       pubkey hash   omni lock flags
          // chain identity   eth addr      function flag()
          // 00: Nervos       👇            00: owner
          // 01: Ethereum     👇            01: administrator
          //      👇          👇            👇
          args: `0x01${ethAddr.substring(2)}00`,
        };

        setOmniAddr(helpers.generateAddress(omniLock));
        setOmniLock(omniLock);
        setEthAddr(ethAddr);
      });
  }, []);

  useEffect(() => {
    if (!omniAddr) return;

    capacityOf(omniAddr).then((balance) => setBalance(balance.toString()));
  }, [omniAddr]);

  if (!ethereum) return <div>MetaMask is not installed</div>;

  return (
    <div>
      <ul>
        <li>Ethereum Address: {ethAddr}</li>
        <li>Nervos Address(Omni): {omniAddr}</li>
        <li>
          Current Omni lock script:
          <pre>{JSON.stringify(omniLock, null, 2)}</pre>
        </li>

        <li>Total capacity: {balance}</li>
      </ul>

      <div>
        <h2>Transfer</h2>
        <label htmlFor="address">Address</label>&nbsp;
        {/* prettier-ignore */}
        <input id="address" type="text" onChange={(e) => setTransferAddress(e.target.value)} />
        <br />
        <label htmlFor="amount">Amount(at least 63_00000000 shannon)</label>
        &nbsp;
        {/* prettier-ignore */}
        <input id="amount" type="text" onChange={(e) => setTransferAmount(e.target.value)} />
        <br />
        {/* prettier-ignore */}
        <button onClick={() => transfer({ amount: transferAmount, from: omniAddr, to: transferAddr }) } >
          Transfer
        </button>
      </div>
    </div>
  );
}
