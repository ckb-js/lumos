import "bulma/css/bulma.css";

import React, { FC, ReactNode, useEffect, useMemo } from "react";
import { useSetState } from "react-use";
import ReactDOM from "react-dom";
import {
  fetchCKBBalance,
  fetchSUDTBalance,
  generateAddressInfoFromPrivateKey,
  issueSUDT,
  transferCKB2SUDT,
  CKB2SUDTRate,
  SUDT_PER_CELL_VALUE,
} from "./lib";

const App: FC = () => {
  const [state, setState] = useSetState({
    issuerPrivateKey: "",
    holderPrivateKey: "",
    issueSUDTTxHash: "",
    transferSUDTTxHash: "",

    // SUDT issuer
    issuerBalance: { CKB: "0", SUDT: "0" } as Balance,

    // CKB holder
    holderBalance: { CKB: "0", SUDT: "0" } as Balance,
  });

  // when click issue SUDT button, will call this function.
  // issue SUDT to issuer's address
  const issueSomeSUDT = async () => {
    const tx = await issueSUDT(state.issuerPrivateKey);
    setState({ issueSUDTTxHash: tx });
  };

  // when click transfer SUDT button, will call this function.
  // exchange CKB to SUDT by SUDT issuer
  // SUDT issuer --SUDT-> CKB holder, and CKB holder --CKB-> SUDT issuer
  const exchangeCKB2SUDT = async () => {
    if (!issuerAccountInfo || !holderAccountInfo) {
      return;
    }
    const tx = await transferCKB2SUDT(state.issuerPrivateKey, state.holderPrivateKey, 125 * 1e8);
    setState({ transferSUDTTxHash: tx });
  };

  const issuerAccountInfo = useMemo(
    () => (state.issuerPrivateKey ? generateAddressInfoFromPrivateKey(state.issuerPrivateKey) : undefined),
    [state.issuerPrivateKey]
  );
  const holderAccountInfo = useMemo(
    () => (state.holderPrivateKey ? generateAddressInfoFromPrivateKey(state.holderPrivateKey) : undefined),
    [state.holderPrivateKey]
  );

  const refreshBalance = async () => {
    if (issuerAccountInfo) {
      const SUDT = (await fetchSUDTBalance(issuerAccountInfo.address)).toString();
      const CKB = (await fetchCKBBalance(issuerAccountInfo.address)).div(10 ** 8).toString();
      setState({ issuerBalance: { SUDT, CKB } });
    }

    if (holderAccountInfo) {
      const SUDT = (await fetchSUDTBalance(holderAccountInfo.address)).toString();
      const CKB = (await fetchCKBBalance(holderAccountInfo.address)).div(10 ** 8).toString();
      setState({ holderBalance: { SUDT, CKB } });
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [issuerAccountInfo, holderAccountInfo]);

  return (
    <div className="m-5">
      {state.issueSUDTTxHash && (
        <Notification onClose={() => setState({ issueSUDTTxHash: "" })}>
          Issue transaction sent, view it on{" "}
          <a href={`https://pudge.explorer.nervos.org/transaction/${state.issueSUDTTxHash}`} target="_blank">
            CKB Explorer(You may need to retry search if it is not found)
          </a>
        </Notification>
      )}
      {state.transferSUDTTxHash && (
        <Notification onClose={() => setState({ transferSUDTTxHash: "" })}>
          Transfer transaction sent, view it on{" "}
          <a href={`https://pudge.explorer.nervos.org/transaction/${state.transferSUDTTxHash}`} target="_blank">
            CKB Explorer(You may need to retry search if it is not found)
          </a>
        </Notification>
      )}
      <div className="block">
        <Field
          label="Issuer private key"
          value={state.issuerPrivateKey}
          onChange={(e) => setState({ issuerPrivateKey: e.target.value })}
        />
        {issuerAccountInfo && <div>Address: {issuerAccountInfo.address}</div>}
        {state.issuerBalance && <label className="tag">SUDT amount: {state.issuerBalance.SUDT}</label>}
        <div>
          <button className="button is-primary" onClick={issueSomeSUDT}>
            Issue {SUDT_PER_CELL_VALUE} SUDT
          </button>
        </div>
        <Field
          label="Holder private key"
          value={state.holderPrivateKey}
          onChange={(e) => setState({ holderPrivateKey: e.target.value })}
        />
        {holderAccountInfo && <div>Address: {holderAccountInfo.address}</div>}
        {state.holderBalance && (
          <label className="tag">
            SUDT amount: {state.holderBalance.SUDT}, CKB amount: {state.holderBalance.CKB}
          </label>
        )}
      </div>

      <div className="block">1 CKB = {CKB2SUDTRate} SUDT</div>
      <div>
        <button className="button" onClick={exchangeCKB2SUDT}>
          Exchange 125 CKB to 125 SUDT
        </button>
      </div>
    </div>
  );
};

type Balance = {
  CKB: string;
  SUDT: string;
};
const Field: FC<{ label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="control">
        <input className="input" type="text" value={value} onChange={onChange} />
      </div>
    </div>
  );
};
const Notification: FC<{ onClose: () => void; children: ReactNode }> = ({ children, onClose }) => {
  return (
    <div className="notification is-success">
      <div className="delete" onClick={onClose}></div>
      {children}
    </div>
  );
};

// prevent can not find DOM element on Codesandbox
const el = document.getElementById("root") || document.createElement("div");
el.id = "root";
document.body.appendChild(el);

ReactDOM.render(<App />, el);
