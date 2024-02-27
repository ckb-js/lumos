#!/usr/bin/env node
import { codegen } from "./codegen";
import * as fs from "node:fs";

const DEFAULT_CONFIG_FILE_NAME = "lumos-molecule-codegen.json";

function camelcase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

type Config = {
  objectKeyFormat: "camelcase" | "keep";
  prepend: string;
  schemaFile: string;
};

const fileConfig: Partial<Config> = (() => {
  if (fs.existsSync(DEFAULT_CONFIG_FILE_NAME)) {
    return JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE_NAME, "utf8"));
  }
  return {};
})();

const config: Config = {
  objectKeyFormat: fileConfig.objectKeyFormat || "keep",
  prepend: fileConfig.prepend || "",
  schemaFile: fileConfig.schemaFile || "schema.mol",
};

// check if the schema file exists
if (!fs.existsSync(config.schemaFile)) {
  console.error(
    `Schema file ${config.schemaFile} does not exist. Please configure the \`schemaFile\` in ${DEFAULT_CONFIG_FILE_NAME}`
  );
  process.exit(1);
}

const generated = codegen(fs.readFileSync(config.schemaFile, "utf-8"), {
  prepend: config.prepend,
  formatObjectKeys:
    config.objectKeyFormat === "camelcase" ? camelcase : undefined,
});

console.log(generated);
