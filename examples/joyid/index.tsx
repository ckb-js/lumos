import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { connect, initConfig, signRawTransaction } from "@joyid/ckb";
import { buildTransfer, capacityOf, sendTransaction } from "./lib";
import { formatUnit, parseUnit } from "@ckb-lumos/lumos/utils";
import { createTransactionFromSkeleton } from "@ckb-lumos/lumos/helpers";
import { registerCustomLockScriptInfos } from "@ckb-lumos/lumos/common-scripts/common";
import { createJoyIDScriptInfo, getDefaultConfig } from "@ckb-lumos/joyid";

initConfig({ network: "testnet" });

const App = () => {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("-");
  const [transferAddr, setTransferAddr] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (!address) return;
    capacityOf(address).then((balance) => setBalance(formatUnit(balance, "ckb") + " CKB"));
  }, [address]);

  async function onConnect() {
    const connection = await connect();
    registerCustomLockScriptInfos([createJoyIDScriptInfo(connection, getDefaultConfig(false))]);
    setAddress(connection.address);
  }

  async function transfer(): Promise<string> {
    const unsigned = await buildTransfer({ amount: parseUnit(transferAmount, "ckb"), from: address, to: transferAddr });
    const tx = createTransactionFromSkeleton(unsigned);

    console.log("signRawTransaction: ", JSON.stringify(tx));
    // @ts-ignore data2 is not defined in joyid sdk
    const signed = await signRawTransaction(tx, address);
    console.log("signed transaction: ", JSON.stringify(signed));
    return sendTransaction(signed);
  }

  function onTransfer() {
    if (isSendingTx) return;
    setIsSendingTx(true);

    transfer()
      .then(setTxHash)
      .finally(() => setIsSendingTx(false));
  }

  if (!address) {
    return (
      <div>
        <button onClick={onConnect}>Connect</button>
      </div>
    );
  }

  if (!address.startsWith("ckt")) {
    alert("The example should only be used in CKB testnet");
  }

  return (
    <div>
      <div>CKB address: {address}</div>
      <div>Balance: {balance}</div>
      <h2>Transfer</h2>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          id="amount"
          placeholder="Amount(CKB)"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <br />
        <label htmlFor="address">Address</label>
        <input
          id="address"
          placeholder="ckt1..."
          value={transferAddr}
          onChange={(e) => setTransferAddr(e.target.value)}
        />
        <br />
        <button onClick={onTransfer} disabled={isSendingTx}>
          Transfer
        </button>
        <br />
        {txHash && (
          <a target="_blank" href={`https://pudge.explorer.nervos.org/transaction/${txHash}`}>
            Check In Explorer
          </a>
        )}
      </div>
    </div>
  );
};

const app = document.getElementById("root");
ReactDOM.render(<App />, app);
