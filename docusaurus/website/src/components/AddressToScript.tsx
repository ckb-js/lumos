import React, { useState } from "react";
import { Button, Form, Input, Typography } from "antd";
import { useFormik } from "formik";
import "antd/dist/antd.css";
import styled from "styled-components";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import { toConfigWithoutShortId } from "../helpers/configHelper";

let config;
let helpers;
declare global {
  interface Window {
    lumos?: any;
  }
}
if (ExecutionEnvironment.canUseDOM) {
  const lumos = require("@ckb-lumos/lumos");
  config = lumos.config;
  helpers = lumos.helpers;
}

export type HashType = "type" | "data";
export interface Script {
  code_hash: string;
  hash_type: HashType;
  args: string;
}
type AddressType = "Mainnet" | "Testnet";

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
interface ModalFormErrors {
  address?: string;
}

interface ModalFormValues {
  address: string;
}
export const AddressToScript = () => {
  const [script, setScript] = useState<Script>();
  const [newAddress, setNewAddress] = useState<Script>();
  const [deprecatedFullAddress, setDeprecateFullAddress] = useState<Script>();
  const [deprecatedAddress, setDeprecatedAddress] = useState<Script>();
  const [addressType, setAddressType] = useState<AddressType>();
  const validate = (values: ModalFormValues): ModalFormErrors => {
    const errors: ModalFormErrors = {};
    if (!values.address) {
      errors.address = "address required";
    }
    return errors;
  };
  const formik = useFormik({
    async onSubmit(val, { setFieldError }) {
      validate(val);
      if (val.address.startsWith("ckb")) {
        config.initializeConfig(config.predefined.LINA);
        setAddressType("Mainnet");
      } else if (val.address.startsWith("ckt")) {
        setAddressType("Testnet");
        config.initializeConfig(config.predefined.AGGRON4);
      } else {
        setFieldError("address", "ckb address must start with ckb/ckt");
        setAddressType(undefined);
        return;
      }
      try {
        let script = helpers.addressToScript(val.address);
        setScript(script);

        let configWithShortId = config.getConfig();
        let configWithoutShortId = toConfigWithoutShortId(configWithShortId);

        let newAddress = helpers.encodeToAddress(script);
        setNewAddress(newAddress);
        let deprecatedFullAddress = helpers.generateAddress(script, {
          config: configWithoutShortId,
        });
        setDeprecateFullAddress(deprecatedFullAddress);
        let deprecatedAddress = helpers.generateAddress(script);
        if (deprecatedAddress !== newAddress) {
          setDeprecatedAddress(deprecatedAddress);
        } else {
          setDeprecatedAddress(undefined);
        }
      } catch (e) {
        setFieldError("address", e.message);
        setAddressType(undefined);
      }
    },
    validate,
    initialValues: {
      address: "",
    },
  });

  const getLockName = (script) => {
    return config.helpers.nameOfScript(script);
  };

  return (
    <StyleWrapper>
      <Form name="basic">
        <Form.Item
          label="Address"
          validateStatus={formik.errors.address ? "error" : "success"}
        >
          <Input
            name="address"
            onChange={formik.handleChange}
            value={formik.values.address}
          />
          <span className="errorMessage">{formik.errors.address}</span>
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => formik.submitForm()}
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
      <Form name="scriptToAddress" className="resultForm">
        <Form.Item label="Address(new full format)">
          {newAddress && (
            <Typography.Text copyable>{newAddress}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="Address(deprecated full format)">
          {deprecatedFullAddress && (
            <Typography.Text copyable>{deprecatedFullAddress}</Typography.Text>
          )}
        </Form.Item>
        {deprecatedAddress && (
          <Form.Item label="Address(deprecated short format)">
            <Typography.Text copyable>{deprecatedAddress}</Typography.Text>
          </Form.Item>
        )}

        <Form.Item label="CodeHash">
          {script && script?.code_hash && (
            <Typography.Text copyable>{script?.code_hash}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="HashType">
          {script?.hash_type && (
            <Typography.Text copyable>{script?.hash_type}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="args">
          {script?.args && (
            <Typography.Text copyable>{script?.args}</Typography.Text>
          )}
        </Form.Item>
        <Form.Item label="network">
          {addressType && (
            <Typography.Text copyable>{addressType}</Typography.Text>
          )}
        </Form.Item>
        {script && getLockName(script) && (
          <Form.Item label="lock name">
            <Typography.Text copyable>{getLockName(script)}</Typography.Text>
          </Form.Item>
        )}
      </Form>
    </StyleWrapper>
  );
};
