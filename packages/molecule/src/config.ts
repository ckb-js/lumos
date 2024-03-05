import * as fs from "node:fs";

const DEFAULT_CONFIG_FILE_NAME =
  process.env.CONF_PATH || "lumos-molecule-codegen.json";

export type Config = {
  objectKeyFormat: "camelcase" | "keep";
  prepend: string;
  schemaFile: string;
  output: number; // 0: Default out console, 1: Write file, 2. Just return
  dir: string; //
};

export function initConfig(): Config {
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
    output: fileConfig.output || 0,
    dir: fileConfig.dir || __dirname,
  };

  return config;
}
