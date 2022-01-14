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
      <Menu.ItemGroup key="g1" title="Item 1">
        <Menu.Item key="/tools/address-conversion">
          <NavLink to="/tools/address-conversion">Address Conversion</NavLink>
        </Menu.Item>
        <Menu.Item key="/tools/test">
          <NavLink to="/tools/test">Test Page</NavLink>
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup key="g2" title="Item 2">
        <Menu.Item key="3">Option 3</Menu.Item>
        <Menu.Item key="4">Option 4</Menu.Item>
      </Menu.ItemGroup>

      <Menu.Item key="5">Option 5</Menu.Item>
      <Menu.Item key="6">Option 6</Menu.Item>
    </Menu>
  );
};
