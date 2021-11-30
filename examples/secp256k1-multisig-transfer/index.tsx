import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Script } from "@ckb-lumos/lumos";
import { generateAccountFromPrivateKey, transfer } from "./lib";

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [privKey1, setPrivKey1] = useState("0x2c56a92a03d767542222432e4f2a0584f01e516311f705041d86b1af7573751f");
  const [privKey2, setPrivKey2] = useState("0x3bc65932a75f76c5b6a04660e4d0b85c2d9b5114efa78e6e5cf7ad0588ca09c8");
  const [privKey3, setPrivKey3] = useState("0xbe06025fbd8c74f65a513a28e62ac56f3227fcb307307a0f2a0ef34d4a66e81f");
  const [fromAddr, setFromAddr] = useState("");
  const [fromLock, setFromLock] = useState<Script>();

  const [toAddr, setToAddr] = useState("ckt1qyqr6dwc07kqqz96tvfwu8zenvgzlj84lhuqsm0peh");
  const [amount, setAmount] = useState("11100000000");
  const [privKeys, setPrivKeys] = useState<string[]>([]);

  useEffect(() => {
    const updateFromInfo = async () => {
      const { lockScript, address } = generateAccountFromPrivateKey();
      setFromAddr(address);
      setFromLock(lockScript);
    };

    updateFromInfo();

  }, []);

  useEffect(() => {
    setPrivKeys([privKey1, privKey2]);
  }, [privKey1, privKey2, privKey3]);

  return (
    <div>
      <ul>
        <li>CKB Address: {fromAddr}</li>
        <li>
          Lock script:
          <pre>{JSON.stringify(fromLock, null, 2)}</pre>
        </li>
      </ul>

      <label htmlFor="private-key1">Private Key1: </label>&nbsp;
      <input
        id="private-key1"
        type="text"
        onChange={(e) => setPrivKey1(e.target.value)}
      />
      <label htmlFor="private-key2">Private Key2: </label>&nbsp;
      <input
        id="private-key2"
        type="text"
        onChange={(e) => setPrivKey2(e.target.value)}
      />
      <label htmlFor="private-key3">Private Key3: </label>&nbsp;
      <input
        id="private-key3"
        type="text"
        onChange={(e) => setPrivKey3(e.target.value)}
      />
      <br />

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
          transfer({ amount, to: toAddr, privKeys })
        }
      >
        Transfer
      </button>
    </div>
  );
}
