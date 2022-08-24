import "bulma/css/bulma.css";

import React, { FC, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  fetchCKBBalance,
  fetchSUDTBalance,
  generateAccountFromPrivateKey,
  mintSUDT,
  // transferCKB,
  // transferSUDT,
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

const App: FC = () => {
  const [issuerPrivateKey, setIssuerPrivateKey] = useState(
    "0x496fb24bfd613947d7c64a3773a9f58c5d632a9bc1cf8e4a7f938e688fa93143"
  );
  const [holderPrivateKey, setHolderPrivateKey] = useState(
    "0xda486337c5f007b036ef144bc2b9fb02e5ab2351cd685c919e9899b70296d001"
  );
  const [issuerBalance, setIssuerBalance] = useState({ SUDT: "0", CKB: "0" });
  const [holderBalance, setHolderBalance] = useState({ SUDT: "0", CKB: "0" });

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

  const mintSomeSUDT = async () => {
    await mintSUDT(issuerPrivateKey, 10 ** 8);
    refreshBalance();
  };

  const exchangeCKB2SUDT = async () => {
    if (!issuerAccountInfo || !holderAccountInfo) {
      return;
    }
    await transferCKB2SUDT(issuerPrivateKey, holderPrivateKey, 250 * 1e8);
  };

  const exchangeSUDT2CKB = async () => {
    if (!issuerAccountInfo || !holderAccountInfo) {
      return;
    }
    transferCKB2SUDT(issuerPrivateKey, holderPrivateKey, 2500);
    // await transferSUDT(holderPrivateKey, issuerAccountInfo?.address, 25000);
    // await transferCKB(issuerPrivateKey, holderAccountInfo?.address, 2500 * 10 ** 6);
  };

  return (
    <div className="m-5">
      <div className="block">
        <Field
          label="Issuer private key"
          value={issuerPrivateKey}
          onChange={(e) => setIssuerPrivateKey(e.target.value)}
        />
        {issuerAccountInfo && <div>Address: {issuerAccountInfo.address}</div>}
        {issuerBalance && <label className="tag">SUDT amount: {issuerBalance.SUDT}</label>}
        <div>
          <button className="button is-primary" onClick={mintSomeSUDT}>
            Issue 1000000 SUDT
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
          Exchange 25 CKB to 2500 SUDT
        </button>
        <button className="button" onClick={exchangeSUDT2CKB}>
          Exchange 2500 SUDT to 25 CKB
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
