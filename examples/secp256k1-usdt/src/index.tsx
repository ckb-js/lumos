import "bulma/css/bulma.css";

import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  fetchCKBBalance,
  fetchSUDTBalance,
  generateAccountFromPrivateKey,
  issueSUDT,
  transferCKB2SUDT,
  CKB2SUDTRate,
} from "./lib";

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

const App: FC = () => {
  const [issuerPrivateKey, setIssuerPrivateKey] = useState(
    "0x5a85f2c71da9ca9581dfdf59c19dba77005b9d9a61b3c647a6a122bee1be409e"
  );
  const [holderPrivateKey, setHolderPrivateKey] = useState(
    "0xf35458a0da78428e93858c996097afed03d61b9b3504ed56be7202ed83f45260"
  );
  const [issuerBalance, setIssuerBalance] = useState({ SUDT: "0", CKB: "0" });
  const [holderBalance, setHolderBalance] = useState({ SUDT: "0", CKB: "0" });
  const [issueSUDTTx, setIssueSUDTTx] = useState("");
  const [transferSUDTTx, setTransferSUDTTx] = useState("");

  const issuerAccountInfo = useMemo(
    () => (issuerPrivateKey ? generateAccountFromPrivateKey(issuerPrivateKey) : undefined),
    [issuerPrivateKey]
  );
  const holderAccountInfo = useMemo(
    () => (holderPrivateKey ? generateAccountFromPrivateKey(holderPrivateKey) : undefined),
    [holderPrivateKey]
  );

  const refreshBalance = async () => {
    if (issuerAccountInfo) {
      const SUDT = (await fetchSUDTBalance(issuerAccountInfo.address)).toString();
      const CKB = (await fetchCKBBalance(issuerAccountInfo.address)).div(10 ** 8).toString();
      setIssuerBalance({ SUDT, CKB });
    }

    if (holderAccountInfo) {
      const SUDT = (await fetchSUDTBalance(holderAccountInfo.address)).toString();
      const CKB = (await fetchCKBBalance(holderAccountInfo.address)).div(10 ** 8).toString();
      setHolderBalance({ SUDT, CKB });
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [issuerAccountInfo, holderAccountInfo]);

  const issueSomeSUDT = async () => {
    const tx = await issueSUDT(issuerPrivateKey, 10 ** 12);
    setIssueSUDTTx(tx);
  };

  const exchangeCKB2SUDT = async () => {
    if (!issuerAccountInfo || !holderAccountInfo) {
      return;
    }
    const tx = await transferCKB2SUDT(issuerPrivateKey, holderPrivateKey, 250 * 1e8);
    setTransferSUDTTx(tx);
  };

  return (
    <div className="m-5">
      {issueSUDTTx && (
        <Notification onClose={() => setIssueSUDTTx("")}>
          Issue transaction sent, view it on{" "}
          <a href={`https://pudge.explorer.nervos.org/transaction/${issueSUDTTx}`} target="_blank">
            CKB Explorer(You may need to retry search if it is not found)
          </a>
        </Notification>
      )}
      {transferSUDTTx && (
        <Notification onClose={() => setTransferSUDTTx("")}>
          Transfer transaction sent, view it on{" "}
          <a href={`https://pudge.explorer.nervos.org/transaction/${transferSUDTTx}`} target="_blank">
            CKB Explorer(You may need to retry search if it is not found)
          </a>
        </Notification>
      )}
      <div className="block">
        <Field
          label="Issuer private key"
          value={issuerPrivateKey}
          onChange={(e) => setIssuerPrivateKey(e.target.value)}
        />
        {issuerAccountInfo && <div>Address: {issuerAccountInfo.address}</div>}
        {issuerBalance && <label className="tag">SUDT amount: {issuerBalance.SUDT}</label>}
        <div>
          <button className="button is-primary" onClick={issueSomeSUDT}>
            Issue 1000000000000 SUDT
          </button>
        </div>
        <Field
          label="Holder private key"
          value={holderPrivateKey}
          onChange={(e) => setHolderPrivateKey(e.target.value)}
        />
        {holderAccountInfo && <div>Address: {holderAccountInfo.address}</div>}
        {holderBalance && (
          <label className="tag">
            SUDT amount: {holderBalance.SUDT}, CKB amount: {holderBalance.CKB}
          </label>
        )}
      </div>

      <div className="block">1 CKB = {CKB2SUDTRate} SUDT</div>
      <div>
        <button className="button" onClick={exchangeCKB2SUDT}>
          Exchange 250 CKB to 25000 SUDT
        </button>
      </div>
    </div>
  );
};

// prevent can not find DOM element on Codesandbox
const el = document.getElementById("root") || document.createElement("div");
el.id = "root";
document.body.appendChild(el);

ReactDOM.render(<App />, el);
