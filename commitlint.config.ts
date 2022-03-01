import type { UserConfig } from "@commitlint/types";

const scopeEnumValues = [
  "base",
  "bi",
  "ckb-indexer",
  "common-scripts",
  "config-manager",
  "hd",
  "hd-cache",
  "helper",
  "indexer",
  "lumos",
  "rpc",
  "sql-indexer",
  "testkit",
  "toolkit",
  "transaction-manager",
  "examples",
  "website",
  "molecule",
];
const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", scopeEnumValues],
  },
};

module.exports = Configuration;
