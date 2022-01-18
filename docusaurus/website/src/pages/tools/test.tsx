import React from "react";
import { Sidebar } from "../../components/Sidebar";
import Layout from "@theme/Layout";

export default function Tools() {
  return (
    <Layout title="Tools" description="">
      <div style={{ display: "flex" }}>
        <Sidebar></Sidebar>
        <h1>THIS IS TEST PAGE</h1>
      </div>
    </Layout>
  );
}
