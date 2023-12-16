import React, { useState } from "react";
import { Script, hd } from "@ckb-lumos/lumos";
import { ec as EC } from "elliptic";
import ReactDOM from "react-dom";
import { capacityOf, CONFIG, buildTransfer, signByPrivateKey, sendTransaction } from "./lib";
import { encodeToAddress } from "@ckb-lumos/lumos/helpers";

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

const ec = new EC("secp256k1");

interface ConnectProps {
  onConnect: (privateKey: string) => any;
}

export function Connect({ onConnect }: ConnectProps) {
  const [privateKey, setPrivateKey] = useState("0x96150d7ce108a2dab7c7689d773422fa1a272f85f0ddf4c5a3d807b2b145d3ba");

  const genRandomKeyPair = () => {
    const key = ec.genKeyPair();
    setPrivateKey(`0x${key.getPrivate().toString("hex")}`);
  };

  return (
    <div>
      <input value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="0x..." />

      <button onClick={genRandomKeyPair} style={{ marginLeft: 8 }}>
        generatePrivateKey
      </button>
      <button onClick={() => onConnect(privateKey)} disabled={privateKey === ""} style={{ marginLeft: 8 }}>
        Connect
      </button>
    </div>
  );
}

export function App() {
  const [privateKey, setPrivateKey] = useState("");
  const [omniAddr, setOmniAddr] = useState("");
  const [omniLock, setOmniLock] = useState<Script>();
  const [balance, setBalance] = useState("-");

  const [transferAddr, setTransferAddress] = useState(
    "ckt1q3uljza4azfdsrwjzdpea6442yfqadqhv7yzfu5zknlmtusm45hpuq9tv9dma3hzzt8k7a7ekqpkja4saaf2fecq3l3xmk"
  );
  const [transferAmount, setTransferAmount] = useState("10000000000");

  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txHash, setTxHash] = useState("");

  function connectByPrivateKey(pk: string) {
    const pubkeyHash = hd.key.privateKeyToBlake160(pk);

    const omniLock: Script = {
      codeHash: CONFIG.SCRIPTS.OMNILOCK.CODE_HASH,
      hashType: CONFIG.SCRIPTS.OMNILOCK.HASH_TYPE,
      // omni flag       pubkey hash   omni lock flags
      // chain identity   eth addr      function flag()
      // 00: Nervos       👇            00: owner
      // 01: Ethereum     👇            01: administrator
      //      👇          👇            👇
      args: `0x00${pubkeyHash.substring(2)}00`,
    };

    const omniAddr = encodeToAddress(omniLock);
    setPrivateKey(pk);
    setOmniAddr(omniAddr);
    setOmniLock(omniLock);
    capacityOf(omniAddr).then((balance) => setBalance(balance.div(10 ** 8).toString() + " CKB"));
  }

  async function transfer(): Promise<string> {
    const unsigned = await buildTransfer({ amount: transferAmount, from: omniAddr, to: transferAddr });

    const signed = await signByPrivateKey(unsigned, privateKey);

    const txHash = await sendTransaction(signed);

    return txHash;
  }

  async function onTransfer() {
    if (isSendingTx) return;
    setIsSendingTx(true);

    transfer()
      .then(setTxHash)
      .catch((e) => alert(e.message || JSON.stringify(e)))
      .finally(() => setIsSendingTx(false));
  }

  if (!omniAddr) return <Connect onConnect={(key: string) => connectByPrivateKey(key)} />;

  return (
    <div>
      <ul>
        <li>privateKey: {privateKey}</li>
        <li>Nervos Address(Omni): {omniAddr}</li>
        <li>
          Current Omni lock script:
          <pre>{JSON.stringify(omniLock, null, 2)}</pre>
        </li>

        <li>Balance: {balance}</li>

        <button onClick={() => setOmniAddr("")}>disconnect</button>
      </ul>

      <div>
        <h2>Transfer to</h2>
        <label htmlFor="address">Address</label>&nbsp;
        <input value={transferAddr} onChange={(e) => setTransferAddress(e.target.value)} placeholder="ckt1..." />
        <br />
        <label htmlFor="amount">Amount</label>
        &nbsp;
        <input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="shannon" />
        <br />
        <button onClick={onTransfer} disabled={isSendingTx}>
          Transfer
        </button>
        <p>
          Tx Hash:{" "}
          {txHash !== "" && (
            <a target="_blank" href={`https://explorer.nervos.org/aggron/transaction/${txHash}`}>
              {txHash}
            </a>
          )}{" "}
        </p>
      </div>
    </div>
  );
}
