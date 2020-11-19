const test = require("ava");
const fs = require("fs");
const path = require("path");
const { Chain } = require("../lib");
const { Indexer, TransactionCollector } = require("@ckb-lumos/indexer");
const depositionLockScript = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
};
const rollupTypeScript = {};
const depositionRequest0 = {};
const depositionRequest1 = {};
const depositionRequest2 = {};
const depositionRequests = [
  depositionRequest0,
  depositionRequest1,
  depositionRequest2,
];

const depositionTransaction0 = {};
const depositionTransaction1 = {};
const depositionTransaction2 = {};

const submitBlockTransaction = {};

const configPath = path.join(__dirname, "..", "config", "dev.config.json");

class MockTransactionCollector extends TransactionCollector {
  async *collect() {
    yield depositionTransaction0;
    yield depositionTransaction1;
    yield depositionTransaction2;
  }
}

test("Init a chain by config", (t) => {
  let chain = new Chain(configPath);
  t.pass();
});

test("Sync rollup data from CKB network", async (t) => {
  let chain = new Chain(configPath);
  const indexer = new Indexer("mockUri", "mockDataPath");
  const queryOption = {
    lock: depositionLockScript,
  };
  const txCollector = new MockTransactionCollector(indexer, queryOption);
  let depositionTransactions = [];
  for await (const tx of txCollector.collect()) {
    depositionTransactions.push(tx);
  }

  t.pass();
});
