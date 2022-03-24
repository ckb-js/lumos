import React, { useState } from "react";
import { Button, Form, Input, Radio } from "antd";
import { useFormik } from "formik";
import "antd/dist/antd.css";
import styled from "styled-components";
import {
  utils,
  hd,
  helpers,
  commons,
  RPC,
  config,
  Indexer,
} from "@site/../../packages/lumos/lib";
import { CellProvider } from "@site/../../packages/base/";

const StyleWrapper = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;

  .ant-tabs {
    min-width: 900px;
  }

  .errorMessage {
    color: #ff4d4f;
  }
`;

interface ModalFormValues {
  network: string;
  rpc: string;
  indexer: string;
  deploy_type: string;
  contract: Uint8Array;
  priv_key: string;
}

async function signAndSendTransaction(
  txSkeleton: helpers.TransactionSkeletonType,
  privatekey: string,
  rpc: RPC
): Promise<string> {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.signingEntries.get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privatekey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);
  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}

async function loadSecp256k1ScriptDep(rpc: RPC): Promise<config.ScriptConfig> {
  const genesisBlock = await rpc.get_block_by_number("0x0");

  if (!genesisBlock) throw new Error("cannot load genesis block");

  const secp256k1DepTxHash = genesisBlock.transactions[1].hash;
  const typeScript = genesisBlock.transactions[0].outputs[1].type;

  if (!secp256k1DepTxHash) throw new Error("Cannot load secp256k1 transaction");
  if (!typeScript) throw new Error("cannot load secp256k1 type script");

  const secp256k1TypeHash = utils.computeScriptHash(typeScript);

  return {
    HASH_TYPE: "type",
    CODE_HASH: secp256k1TypeHash,
    INDEX: "0x0",
    TX_HASH: secp256k1DepTxHash,
    DEP_TYPE: "dep_group",
  };
}

async function loadSecp256k1MultiScriptDep(
  rpc: RPC
): Promise<config.ScriptConfig> {
  const genesisBlock = await rpc.get_block_by_number("0x0");

  if (!genesisBlock) throw new Error("cannot load genesis block");

  const secp256k1MultiSigDepTxHash = genesisBlock.transactions[1].hash;
  const typeScript = genesisBlock.transactions[0].outputs[4].type;

  if (!secp256k1MultiSigDepTxHash)
    throw new Error("Cannot load secp256k1MultiSig transaction");
  if (!typeScript) throw new Error("cannot load secp256k1MultiSig type script");

  const secp256k1MultiSigTypeHash = utils.computeScriptHash(typeScript);

  return {
    HASH_TYPE: "type",
    CODE_HASH: secp256k1MultiSigTypeHash,
    INDEX: "0x1",
    TX_HASH: secp256k1MultiSigDepTxHash,
    DEP_TYPE: "dep_group",
  };
}

export const Deploy = () => {
  const [scriptConfig, setScriptConfig] = useState();
  const [isSendingTx, setIsSendingTx] = useState(false);

  const handleUpload = async (e) => {
    const file = e.currentTarget.files[0];
    const buffer = await file.arrayBuffer();
    let byteArray = new Uint8Array(buffer);
    contractDeploymentForm.values.contract = byteArray;
  };

  const contractDeploymentForm = useFormik<ModalFormValues>({
    async onSubmit(val, { setFieldError }) {
      setScriptConfig(undefined);
      if (val.network === "rpc" && !val.rpc) {
        setFieldError("rpc", "rpc port required");
        return;
      }
      if (val.network === "rpc" && !val.indexer) {
        setFieldError("indexer", "indexer rpc port required");
        return;
      }
      if (!val.contract) {
        setFieldError("contract", "binary contract file required");
        return;
      }
      if (!val.priv_key) {
        setFieldError("priv_key", "private key required");
        return;
      }
      if (isSendingTx) return;
      setIsSendingTx(true);
      try {
        let cfg;
        let indexer;
        let rpc;
        if (val.network === "lina") {
          cfg = config.predefined.LINA;
          const rpcURL = "https://mainnet.ckb.dev/rpc";
          const indexerURL = "https://mainnet.ckb.dev/indexer";
          indexer = new Indexer(indexerURL, rpcURL);
          rpc = new RPC(rpcURL);
        } else if (val.network === "aggron") {
          cfg = config.predefined.AGGRON4;
          const rpcURL = "https://testnet.ckb.dev/rpc";
          const indexerURL = "https://testnet.ckb.dev/indexer";
          indexer = new Indexer(indexerURL, rpcURL);
          rpc = new RPC(rpcURL);
        } else {
          const rpcURL = `${val.rpc}/rpc`;
          const indexerURL = `${val.indexer}/indexer`;
          indexer = new Indexer(indexerURL, rpcURL);
          rpc = new RPC(rpcURL);

          const secpScript = await loadSecp256k1ScriptDep(rpc);
          const multiSigScript = await loadSecp256k1MultiScriptDep(rpc);
          cfg = {
            PREFIX: "ckt",
            SCRIPTS: {
              SECP256K1_BLAKE160: secpScript,
              SECP256K1_BLAKE160_MULTISIG: multiSigScript,
            },
          };
        }

        const pubKey = hd.key.privateToPublic(val.priv_key);
        const args = hd.key.publicKeyToBlake160(pubKey);
        const secp256k1 = cfg.SCRIPTS["SECP256K1_BLAKE160"]!;
        const lockScript = {
          code_hash: secp256k1.CODE_HASH,
          hash_type: secp256k1.HASH_TYPE,
          args: args,
        };
        const address = helpers.generateAddress(lockScript, { config: cfg });

        const deployOptions = {
          cellProvider: indexer as CellProvider,
          scriptBinary: val.contract,
          fromInfo: address,
          config: cfg,
        };

        let res;
        if (val.deploy_type === "type") {
          res = await commons.deploy.generateDeployWithTypeIdTx(deployOptions);
        } else {
          res = await commons.deploy.generateDeployWithDataTx(deployOptions);
        }

        const txHash = await signAndSendTransaction(
          res.txSkeleton,
          val.priv_key,
          rpc
        );
        if (txHash) {
          const scriptConfig = res.scriptConfig;
          setScriptConfig(scriptConfig);
        }
      } catch (e) {
        alert(e.message || JSON.stringify(e));
      } finally {
        setIsSendingTx(false);
      }
    },
    initialValues: {
      network: "aggron",
      rpc: "",
      indexer: "",
      deploy_type: "type",
      contract: undefined,
      priv_key: "",
    },
  });

  return (
    <StyleWrapper>
      <div>
        <Form name="contractDeployment">
          <Form.Item label="Select Network">
            <Radio.Group
              name="network"
              onChange={contractDeploymentForm.handleChange}
              value={contractDeploymentForm.values.network}
            >
              <Radio value="aggron">AGGRON</Radio>
              <Radio value="lina">LINA</Radio>
              <Radio value="rpc">RPC URL</Radio>
            </Radio.Group>
          </Form.Item>
          {contractDeploymentForm.values.network === "lina" ? (
            <p style={{ color: "red" }}>Be careful when you deploy on LINA</p>
          ) : null}
          {contractDeploymentForm.values.network === "rpc" ? (
            <div>
              <Form.Item
                label="CKB RPC URL"
                validateStatus={
                  contractDeploymentForm.errors.rpc ? "error" : "success"
                }
              >
                <Input
                  name="rpc"
                  onChange={contractDeploymentForm.handleChange}
                  value={contractDeploymentForm.values.rpc}
                />
                <span className="errorMessage">
                  {contractDeploymentForm.errors.rpc}
                </span>
              </Form.Item>
              <Form.Item
                label="Indexer RPC URL"
                validateStatus={
                  contractDeploymentForm.errors.rpc ? "error" : "success"
                }
              >
                <Input
                  name="indexer"
                  onChange={contractDeploymentForm.handleChange}
                  value={contractDeploymentForm.values.indexer}
                />
                <span className="errorMessage">
                  {contractDeploymentForm.errors.indexer}
                </span>
              </Form.Item>
            </div>
          ) : null}
          <Form.Item label="Deploy type">
            <Radio.Group
              name="deploy_type"
              onChange={contractDeploymentForm.handleChange}
              value={contractDeploymentForm.values.deploy_type}
            >
              <Radio value="type">type</Radio>
              <Radio value="data">data</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Drop binary contract file into here"
            validateStatus={
              contractDeploymentForm.errors.contract ? "error" : "success"
            }
          >
            <Input name="contract" type="file" onChange={handleUpload} />
            <span className="errorMessage">
              {contractDeploymentForm.errors.contract}
            </span>
          </Form.Item>
          <Form.Item
            label="Your SECP256K1 private key"
            validateStatus={
              contractDeploymentForm.errors.priv_key ? "error" : "success"
            }
          >
            <Input
              name="priv_key"
              onChange={contractDeploymentForm.handleChange}
              value={contractDeploymentForm.values.priv_key}
            />
            <span className="errorMessage">
              {contractDeploymentForm.errors.priv_key}
            </span>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => contractDeploymentForm.submitForm()}
              disabled={isSendingTx}
            >
              {isSendingTx ? "Sending" : "Deploy"}
            </Button>
          </Form.Item>
        </Form>
        <div>
          {scriptConfig == undefined ? null : (
            <pre>{JSON.stringify(scriptConfig, null, 2)}</pre>
          )}
        </div>
      </div>
    </StyleWrapper>
  );
};
