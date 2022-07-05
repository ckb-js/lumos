const scopeEnumValues = [
  "base",
  "bi",
  "ckb-indexer",
  "common-scripts",
  "config-manager",
  "hd",
  "hd-cache",
  "helpers",
  "indexer",
  "lumos",
  "rpc",
  "sql-indexer",
  "testkit",
  "toolkit",
  "transaction-manager",
  "examples",
  "website",
  "codec",
  "omnilock",
  "debugger",
];
const Configuration = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", scopeEnumValues],
  },
};

module.exports = Configuration;
