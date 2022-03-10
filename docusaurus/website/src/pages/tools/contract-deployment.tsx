import React from "react";
import { Sidebar } from "../../components/Sidebar";
import Layout from "@theme/Layout";
import { Deploy } from "@site/src/components/contract-deployment/Deploy";

export default function Tools() {
  return (
    <Layout title="Tools" description="">
      <div style={{ display: "flex" }}>
        <Sidebar></Sidebar>
        <Deploy></Deploy>
      </div>
    </Layout>
  );
}
