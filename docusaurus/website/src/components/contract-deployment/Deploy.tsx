import React from "react";
import "antd/dist/antd.css";
import styled from "styled-components";

const StyleWrapper = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  .ant-tabs {
    min-width: 900px;
  }
`;

export const Deploy = () => {
    return (
      <StyleWrapper>
        <h1>hello</h1>
      </StyleWrapper>
    );
  };