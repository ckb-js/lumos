import React from "react";
import { Menu } from "antd";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";

export const Sidebar = (props) => {
    const keyAddressConversion = useBaseUrl("/tools/address-conversion");
    const contractDeployment = useBaseUrl("/tools/contract-deployment");

    return (
      <Menu
        style={{ width: 256 }}
        defaultSelectedKeys={[useBaseUrl(props.url)]}
        mode="inline"
      >
          <Menu.Item key={keyAddressConversion}>
              <Link to="/tools/address-conversion">Address Conversion</Link>
          </Menu.Item>
          <Menu.Item key={contractDeployment}>
              <Link to="/tools/contract-deployment">Contract Deployment</Link>
          </Menu.Item>
      </Menu>
    );
};
