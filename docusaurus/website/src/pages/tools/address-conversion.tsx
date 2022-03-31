import React from "react";
import { Address } from "../../components/address-conversion/Address";
import { Sidebar } from "../../components/Sidebar";
import Layout from "@theme/Layout";

export default function Tools() {
  return (
    <Layout title="Tools" description="">
      <div style={{ display: "flex" }}>
        <Sidebar url="/tools/address-conversion"></Sidebar>
        <Address></Address>
      </div>
    </Layout>
  );
}
