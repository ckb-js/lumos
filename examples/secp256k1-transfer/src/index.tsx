import "bulma/css/bulma.css";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { nanoid } from "nanoid";
import { BI, Script, helpers } from "@ckb-lumos/lumos";
import { capacityOf, createTxSkeleton, generateAccountFromPrivateKey, transfer } from "./lib";
import { BIish } from "@ckb-lumos/bi";

type TxTarget = {
  amount: BIish;
  address: string;
  key: string;
};

const genScenarioTxTarget = () => ({ key: nanoid(), amount: 0, address: "" });

export function App() {
  const [privKey, setPrivKey] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [fromLock, setFromLock] = useState<Script>();
  const [balance, setBalance] = useState("0");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [txTargets, setTxTargets] = useState<TxTarget[]>([genScenarioTxTarget()]);
  const [txSkeleton, setTxSkeleton] = useState<ReturnType<typeof helpers.TransactionSkeleton> | undefined>();
  const setTargetByIndex = (index: number, field: "amount" | "address") => (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const newTargets = [...txTargets];
    if (field === "amount") {
      newTargets[index].amount = Number(e.target.value);
    } else {
      newTargets[index]["address"] = e.target.value;
    }
    setTxTargets(newTargets);
  };

  const insertTxTarget = () => {
    setTxTargets((origin) => [...origin, genScenarioTxTarget()]);
  };

  const removeTxTarget = (index: number) => () => {
    setTxTargets((origin) => origin.filter((_, i) => i !== index));
  };

  const txOptions = useMemo(
    () => ({
      from: fromAddr,
      targets: txTargets.map((tx) => ({ to: tx.address, amount: BI.from(tx.amount) })),
      privKey,
    }),
    [fromAddr, txTargets, privKey]
  );

  useEffect(() => {
    const updateFromInfo = async () => {
      const { lockScript, address } = generateAccountFromPrivateKey(privKey);
      const capacity = await capacityOf(address);
      setFromAddr(address);
      setFromLock(lockScript);
      setBalance(capacity.toString());
    };

    setErrorMessage("");
    if (privKey) {
      updateFromInfo().catch((e: Error) => {
        setErrorMessage(e.toString());
      });
    }
  }, [privKey]);

  useEffect(() => {
    (async () => {
      if (!txOptions.privKey || !txOptions.from) {
        return;
      }
      try {
        const skeleton = await createTxSkeleton({ ...txOptions, targets: txOptions.targets.filter((it) => it.to) });
        setTxSkeleton(skeleton);
      } catch (e) {
        setErrorMessage(e.toString());
      }
    })();
  }, [txOptions, privKey]);

  const txFee = useMemo(() => {
    if (!txSkeleton) return BI.from(0);
    const outputs = txSkeleton.outputs.reduce((prev, cur) => prev.add(cur.cell_output.capacity), BI.from(0));
    const inputs = txSkeleton.inputs.reduce((prev, cur) => prev.add(cur.cell_output.capacity), BI.from(0));
    return inputs.sub(outputs);
  }, [txSkeleton]);

  const doTransfer = async () => {
    try {
      const txHash = await transfer({
        from: fromAddr,
        targets: txTargets.map((tx) => ({ to: tx.address, amount: BI.from(tx.amount) })),
        privKey,
      });
      setTxHash(txHash);
    } catch (e) {
      setErrorMessage(e.toString());
    }
  };

  const txExplorer = useMemo(() => `https://pudge.explorer.nervos.org/transaction/${txHash}`, [txHash]);
  return (
    <div className="m-5">
      <div className="field">
        <label htmlFor="privateKey" className="label">
          Private Key
        </label>
        <input
          type="text"
          onChange={(e) => setPrivKey(e.target.value)}
          className="input is-primary"
          placeholder="Your CKB Testnet Private Key"
        />
      </div>
      <div className="box">
        <div>
          <strong>CKB Address: </strong> {fromAddr}
        </div>
        <div className="mt-2">
          <strong>Current Lockscript: </strong> {JSON.stringify(fromLock)}
        </div>
        <div className="mt-2">
          <strong>Balance: </strong> {balance} <div className="tag is-info is-light">Shannon</div>
        </div>
      </div>
      <table className="table table is-fullwidth">
        <thead>
          <tr>
            <th>Transfer Address</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {txTargets.map((txTarget, index) => (
            <tr key={txTarget.key}>
              <td>
                <input
                  type="text"
                  value={txTarget.address}
                  onChange={setTargetByIndex(index, "address")}
                  className="input"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={txTarget.amount as string}
                  onChange={setTargetByIndex(index, "amount")}
                  className="input"
                />
              </td>
              <td>
                {txTargets.length > 1 && (
                  <button onClick={removeTxTarget(index)} className="button is-danger">
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>
              <div className="button" onClick={insertTxTarget}>
                Add New Transfer Target
              </div>
            </th>
            <th>Transaction fee {txFee.toBigInt().toString()}</th>
            <th>
              <button className="button is-primary" onClick={doTransfer}>
                Transfer!
              </button>
            </th>
          </tr>
        </tfoot>
      </table>

      {txHash && (
        <div className="notification is-primary">
          <button className="delete" onClick={() => setTxHash("")} />
          Transaction created, View it on{" "}
          <a target="_blank" href={txExplorer}>
            👉CKB Explorer
          </a>
        </div>
      )}
      {errorMessage && (
        <div className="notification is-danger">
          <button className="delete" onClick={() => setErrorMessage("")} />
          {errorMessage}
        </div>
      )}
    </div>
  );
}

// prevent can not find DOM element on Codesandbox
const el = document.getElementById("root") || document.createElement("div");
el.id = "root";
document.body.appendChild(el);

ReactDOM.render(<App />, el);
