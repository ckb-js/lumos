import React, { useState } from "react";
import { Button, Form, Input, Typography } from "antd";
import { useFormik } from "formik";
import "antd/dist/antd.css";
import styled from "styled-components";
import {hasShortId, toConfigWithoutShortId} from "../helpers/configHelper";
import { Address, config, helpers, Script } from "@ckb-lumos/lumos";
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

const LINA_SCRIPTS: config.ScriptConfigs = {
    ...config.predefined.LINA.SCRIPTS,
    PW_LOCK: {
        CODE_HASH:
            "0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc",
        HASH_TYPE: "type",
        TX_HASH:
            "0x1d60cb8f4666e039f418ea94730b1a8c5aa0bf2f7781474406387462924d15d4",
        INDEX: "0x0",
        DEP_TYPE: "code",
    },
    CHEQUE: {
        CODE_HASH:
            "0xe4d4ecc6e5f9a059bf2f7a82cca292083aebc0c421566a52484fe2ec51a9fb0c",
        HASH_TYPE: "type",
        TX_HASH:
            "0x04632cc459459cf5c9d384b43dee3e36f542a464bdd4127be7d6618ac6f8d268",
        INDEX: "0x0",
        DEP_TYPE: "dep_group",
    },
    OMNI_LOCK: {
        CODE_HASH:
            "0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f",
        HASH_TYPE: "type",
        TX_HASH:
            "0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a",
        INDEX: "0x1",
        DEP_TYPE: "code",
    },
}
const LINA_CONFIG = {
    CKB2021: config.predefined.LINA.CKB2021,
    PREFIX: config.predefined.LINA.PREFIX,
    SCRIPTS: LINA_SCRIPTS
}

const AGGRON4_SCRIPTS: config.ScriptConfigs = {
    ...config.predefined.AGGRON4.SCRIPTS,
    PW_LOCK: {
        CODE_HASH:
            "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
        HASH_TYPE: "type",
        TX_HASH:
            "0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38",
        INDEX: "0x0",
        DEP_TYPE: "code",
    },
    CHEQUE: {
        CODE_HASH:
            "0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b",
        HASH_TYPE: "type",
        TX_HASH:
            "0x7f96858be0a9d584b4a9ea190e0420835156a6010a5fde15ffcdc9d9c721ccab",
        INDEX: "0x0",
        DEP_TYPE: "dep_group",
    },
    OMNI_LOCK: {
        CODE_HASH:
            "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
        HASH_TYPE: "type",
        TX_HASH:
            "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
        INDEX: "0x0",
        DEP_TYPE: "code",
    },
}

const AGGRON4_CONFIG = {
    CKB2021: config.predefined.AGGRON4.CKB2021,
    PREFIX: config.predefined.AGGRON4.PREFIX,
    SCRIPTS: AGGRON4_SCRIPTS
}

export const AddressToScript = () => {
    const [script, setScript] = useState<Script>();
    const [newAddress, setNewAddress] = useState<Address>();
    const [deprecatedFullAddress, setDeprecateFullAddress] = useState<Address>();
    const [deprecatedAddress, setDeprecatedAddress] = useState<Address>();
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
                config.initializeConfig(LINA_CONFIG);
                setAddressType("Mainnet");
            } else if (val.address.startsWith("ckt")) {
                setAddressType("Testnet");
                config.initializeConfig(AGGRON4_CONFIG);
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
                if (deprecatedAddress !== newAddress && hasShortId(val.address, configWithShortId)) {
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
