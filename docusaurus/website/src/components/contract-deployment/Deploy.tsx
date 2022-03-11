import React, {useState} from "react";
import { Button, Form, Input, Radio } from "antd";
import { useFormik } from "formik";
import "antd/dist/antd.css";
import styled from "styled-components";
import { Indexer } from "@site/../../packages/ckb-indexer/lib";
import { CellProvider } from "@site/../../packages/base";
import { predefined } from "@site/../../packages/config-manager";
import { key } from "@site/../../packages/hd/lib";
import { generateAddress, sealTransaction, TransactionSkeletonType } from "@site/../../packages/helpers";
import { generateDeployWithTypeIdTx, generateDeployWithDataTx, common } from "@site/../../packages/common-scripts";
import { RPC } from "@site/../../packages/rpc";

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
  deploy_type: string;
  contract: Uint8Array;
  priv_key: string;
}

async function signAndSendTransaction(
  txSkeleton: TransactionSkeletonType,
  privatekey: string,
  rpc: RPC
): Promise<string> {
  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.signingEntries.get(0)?.message;
  const Sig = key.signRecoverable(message!, privatekey);
  const tx = sealTransaction(txSkeleton, [Sig]);
  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}

export const Deploy = () => {
  const [scriptConfig, setScriptConfig] = useState();

  const handleUpload = async (e) => {
    const file = e.currentTarget.files[0];
    const buffer = await file.arrayBuffer();
    let byteArray = new Uint8Array(buffer);
    contractDeploymentForm.values.contract = byteArray;
  }

  const contractDeploymentForm = useFormik<ModalFormValues>({
    async onSubmit(val, { setFieldError }) {
      setScriptConfig(undefined);
      if (val.network === "rpc" && !val.rpc) {
        setFieldError("rpc", "rpc entry required");
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
      let url;
      let config;
      if (val.network === "lina") {
        url = "https://mainnet.ckb.dev";
        config = predefined.LINA;
      } else if (val.network === "aggron") {
        url = "https://testnet.ckb.dev";
        config = predefined.AGGRON4;
      } else {
        url = val.rpc;
        // TODO: config, check if has secp265k1;
      }
      const rpcURL = `${url}/rpc`;
      const indexerURL = `${url}/indexer`;
      const indexer = new Indexer(indexerURL, rpcURL);
      const rpc = new RPC(rpcURL);

      const pubKey = key.privateToPublic(val.priv_key);
      const args = key.publicKeyToBlake160(pubKey);
      const secp256k1 = config.SCRIPTS["SECP256K1_BLAKE160"]!;
      const lockScript = {
        code_hash: secp256k1.CODE_HASH,
        hash_type: secp256k1.HASH_TYPE,
        args: args,
      };
      const address = generateAddress(lockScript, { config: config });

      const deployOptions = {
        cellProvider: indexer as CellProvider,
        scriptBinary: val.contract,
        fromInfo: address,
        config: config
      }

      let res;
      if (val.deploy_type === "type") {
        res = await generateDeployWithTypeIdTx(deployOptions);
        
      } else {
        res = await generateDeployWithDataTx(deployOptions);
      }

      const txHash = await signAndSendTransaction(res.txSkeleton, val.priv_key, rpc);
      if (txHash) {
        const scriptConfig = res.scriptConfig;
        setScriptConfig(scriptConfig);
      }

    },
    initialValues: {
      network: "aggron",
      rpc: "",
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
          <Form.Item
            label="Please enter your RPC entry"
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
          <Input
            name="contract"
            type="file"
            onChange={handleUpload}
          />
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
          >
            Deploy
          </Button>
        </Form.Item>
      </Form>
      <div>
        {scriptConfig == undefined ? null : <pre>{JSON.stringify(scriptConfig, null, 2)}</pre>}
      </div>
      </div>
    </StyleWrapper>
  );
};
