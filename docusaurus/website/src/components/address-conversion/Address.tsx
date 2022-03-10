import React from "react";
import { Tabs } from "antd";
import "antd/dist/antd.css";
import styled from "styled-components";
const { TabPane } = Tabs;
import { AddressToScript } from "./AddressToScript";
import { ScriptToAddress } from "./ScriptToAddress";

const StyleWrapper = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  .ant-tabs {
    min-width: 900px;
  }
`;

export const Address = () => {
  return (
    <StyleWrapper>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Address to Script/new Address" key="1">
          <AddressToScript></AddressToScript>
        </TabPane>
        <TabPane tab="Script to Address" key="2">
          <ScriptToAddress></ScriptToAddress>
        </TabPane>
      </Tabs>
    </StyleWrapper>
  );
};
