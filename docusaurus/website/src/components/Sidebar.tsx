import React from "react";
import { Menu } from "antd";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";

export const Sidebar = () => {
  const keyAddressConversion = useBaseUrl("/tools/address-conversion");

  return (
    <Menu
      style={{ width: 256 }}
      defaultSelectedKeys={[keyAddressConversion]}
      mode="inline"
    >
      <Menu.Item key={keyAddressConversion}>
        <Link to="/tools/address-conversion">Address Conversion</Link>
      </Menu.Item>
    </Menu>
  );
};
