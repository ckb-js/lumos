import React, { useState } from "react";
import { Button, Form, Input, Radio, Typography } from "antd";
import { useFormik } from "formik";
import "antd/dist/antd.css";
import styled from "styled-components";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import { toConfigWithoutShortId } from "../helpers/configHelper";

let config;
let helpers;
if (ExecutionEnvironment.canUseDOM) {
  // const lumos = require("@ckb-lumos/lumos");
  // config = lumos.config;
  // helpers = lumos.helpers;
}

const StyleWrapper = styled.div`
  padding: 20px;
  .resultForm {
    .ant-form-item {
      margin-bottom: 0px;
    }
  }
  .errorMessage {
    color: #ff4d4f;
  }
`;

export const ScriptToAddress = () => {
  const [mainnetAddress, setMainnetAddress] = useState("");
  const [mainNewFullAddr, setMainNewFullAddr] = useState("");
  const [mainDepreFullAddr, setMainDepreFullAddr] = useState("");
  const [testnetAddress, setTestnetAddress] = useState("");
  const [testNewFullAddr, setTestNewFullAddr] = useState("");
  const [testDepreFullAddr, setTestDepreFullAddr] = useState("");
  const scriptToAddressForm = useFormik({
    async onSubmit(val) {
      config.initializeConfig(config.predefined.AGGRON4);
      const address = helpers.scriptToAddress(val);
      const newFullAddr = helpers.encodeToAddress(val);
      setTestNewFullAddr(newFullAddr);
      if (address !== newFullAddr) {
        setTestnetAddress(address);
      } else {
        setTestnetAddress(undefined);
      }

      let configWithShortId = config.getConfig();
      let configWithoutShortId = toConfigWithoutShortId(configWithShortId);

      const deprFullAddr = helpers.scriptToAddress(val, {
        config: configWithoutShortId,
      });
      setTestDepreFullAddr(deprFullAddr);

      config.initializeConfig(config.predefined.LINA);
      const mainnetAddress = helpers.scriptToAddress(val);
      const mainNewFullAddr = helpers.encodeToAddress(val);
      setMainNewFullAddr(mainNewFullAddr);
      if (mainnetAddress !== mainNewFullAddr) {
        setMainnetAddress(mainnetAddress);
      } else {
        setMainnetAddress(undefined);
      }

      configWithShortId = config.getConfig();
      configWithoutShortId = toConfigWithoutShortId(configWithShortId);

      const mainDeprFullAddr = helpers.scriptToAddress(val, {
        config: configWithoutShortId,
      });
      setMainDepreFullAddr(mainDeprFullAddr);
    },
    initialValues: {
      code_hash: "",
      hash_type: "",
      args: "",
    },
  });
  return (
    <StyleWrapper>
      <Form name="scriptToAddress">
        <Form.Item label="CodeHash">
          <Input
            name="code_hash"
            onChange={scriptToAddressForm.handleChange}
            value={scriptToAddressForm.values.code_hash}
          />
        </Form.Item>
        <Form.Item label="HashType">
          <Radio.Group
            name="hash_type"
            onChange={scriptToAddressForm.handleChange}
            value={scriptToAddressForm.values.hash_type}
          >
            <Radio value="data">data</Radio>
            <Radio value="type">type</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="args">
          <Input
            name="args"
            onChange={scriptToAddressForm.handleChange}
            value={scriptToAddressForm.values.args}
          />
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => scriptToAddressForm.submitForm()}
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
      <Form className="resultForm">
        <h4>Testnet</h4>
        <Form.Item label="Address(new full format)">
          {testNewFullAddr && (
            <Typography.Text copyable>{testNewFullAddr}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="Address(deprecated full format)">
          {testDepreFullAddr && (
            <Typography.Text copyable>{testDepreFullAddr}</Typography.Text>
          )}
        </Form.Item>
        {testnetAddress && (
          <Form.Item label="Address(deprecated short format)">
            <Typography.Text copyable>{testnetAddress}</Typography.Text>
          </Form.Item>
        )}

        <h4 style={{ marginTop: 15 }}>Mainnet</h4>
        <Form.Item label="Address(new full format)">
          {mainNewFullAddr && (
            <Typography.Text copyable>{mainNewFullAddr}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="Address(deprecated full format)">
          {mainDepreFullAddr && (
            <Typography.Text copyable>{mainDepreFullAddr}</Typography.Text>
          )}
        </Form.Item>
        {mainnetAddress && (
          <Form.Item label="Address(deprecated short format)">
            <Typography.Text copyable>{mainnetAddress}</Typography.Text>
          </Form.Item>
        )}
      </Form>
    </StyleWrapper>
  );
};
