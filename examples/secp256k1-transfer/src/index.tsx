import "bulma/css/bulma.css";
import React, { useEffect, FC, ReactNode } from "react";
import { useList, useSetState } from "react-use";
import ReactDOM from "react-dom";
import { nanoid } from "nanoid";
import { BI } from "@ckb-lumos/lumos";
import { fetchAddressBalance, generateAccountFromPrivateKey, transfer, Account, MIN_CELL_CAPACITY } from "./lib";

type TransferTarget = {
  capacity: BI;
  address: string;
  key: string;
};

const createTransferTarget = (): TransferTarget => ({ key: nanoid(), capacity: MIN_CELL_CAPACITY, address: "" });

export function App() {
  const [state, setState] = useSetState({
    privateKey: "",
    accountInfo: null as Account | null,
    balance: BI.from(0),
    txHash: "",
    fee: BI.from(0),
  });
  const [transferTargets, transferTargetsActions] = useList<TransferTarget>([createTransferTarget()]);

  // this method will be called when you click "Transfer" button
  const doTransfer = () => {
    if (!state.accountInfo) {
      return;
    }

    transfer({ targets: transferTargets, address: state.accountInfo.address }, state.privateKey).then(
      ({ txHash, fee }) => {
        setState({ txHash: txHash, fee });
      }
    );
  };

  // fetch and update account info and balance when private key changes
  useEffect(() => {
    if (state.privateKey) {
      const accountInfo = generateAccountFromPrivateKey(state.privateKey);
      setState({
        accountInfo,
      });
      fetchAddressBalance(accountInfo.address).then((balance) => {
        setState({ balance });
      });
    }
  }, [state.privateKey]);

  return (
    <div className="m-5">
      <Field
        value={state.privateKey}
        onChange={(e) => {
          setState({ privateKey: e.target.value });
        }}
        label="Private Key"
      />
      <a href="https://ckb.tools/generator" target="_blank">
        Generate A CKB Private key in CKB Tools
      </a>
      <ul>
        <li>CKB Address: {state.accountInfo?.address}</li>
        <li>CKB Balance: {state.balance.div(1e8).toString()}</li>
      </ul>
      <table className="table table is-fullwidth">
        <thead>
          <tr>
            <th>Transfer Address</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transferTargets.map((txTarget, index) => (
            <tr key={txTarget.key}>
              <td>
                <input
                  type="text"
                  value={txTarget.address}
                  onChange={(e) => transferTargetsActions.updateAt(index, { ...txTarget, address: e.target.value })}
                  className="input"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={txTarget.capacity.div(1e8).toString()}
                  onChange={(e) =>
                    transferTargetsActions.updateAt(index, { ...txTarget, capacity: BI.from(e.target.value).mul(1e8) })
                  }
                  className="input"
                />
              </td>
              <td>
                {transferTargets.length > 1 && (
                  <button onClick={() => transferTargetsActions.removeAt(index)} className="button is-danger">
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
              <div
                className="button"
                onClick={() => {
                  transferTargetsActions.push(createTransferTarget());
                }}
              >
                Add New Transfer Target
              </div>
            </th>
            <th>Transaction fee {(state.fee.toNumber() / 1e8).toString()}</th>
            <th>
              <button className="button is-primary" onClick={doTransfer}>
                Transfer!
              </button>
            </th>
          </tr>
        </tfoot>
      </table>
      {state.txHash && (
        <Notification onClear={() => setState({ txHash: "" })}>
          Transaction has sent, View it on{" "}
          <a target="_blank" href={`https://pudge.explorer.nervos.org/transaction/${state.txHash}`}>
            CKB Explorer
          </a>
        </Notification>
      )}
    </div>
  );
}

const Field: FC<{ label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }> = ({
  label,
  value,
  onChange,
}) => (
  <div className="field">
    <label htmlFor={label} className="label">
      {label}
    </label>
    <input
      name={label}
      type="text"
      onChange={onChange}
      value={value}
      className="input is-primary"
      placeholder="Your CKB Testnet Private Key"
    />
  </div>
);

const Notification: FC<{ children: ReactNode; onClear: () => unknown }> = ({ children, onClear }) => (
  <div className="notification is-success">
    <button className="delete" onClick={onClear}></button>
    {children}
  </div>
);

// prevent can not find DOM element on Codesandbox
const el = document.getElementById("root") || document.createElement("div");
el.id = "root";
document.body.appendChild(el);

ReactDOM.render(<App />, el);
