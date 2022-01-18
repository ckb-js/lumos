import React from "react";
import { Menu } from "antd";
import { NavLink, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();

  return (
    <Menu
      style={{ width: 256 }}
      defaultSelectedKeys={[location.pathname]}
      mode="inline"
    >
      {/* https://github.com/facebook/docusaurus/issues/4712 */}
      <Menu.Item key="/lumos/tools/address-conversion"><NavLink to="/lumos/tools/address-conversion">Address Conversion</NavLink></Menu.Item>
    </Menu>
  );
};
