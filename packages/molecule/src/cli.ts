#!/usr/bin/env node
import { codegen, codegenProject, ProjectSchemaOptions } from "./codegen";
import * as fs from "node:fs";
import * as path from "node:path";
import { globSync } from "glob";
// eslint-disable-next-line
// @ts-ignore
import relative from "relative";

const DEFAULT_CONFIG_FILE_NAME = "lumos-molecule-codegen.json";

function camelcase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function writeFile(file: string, contents: string) {
  if (!fs.existsSync(path.dirname(file))) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  fs.writeFileSync(file, contents, "utf-8");
}

type Config = {
  objectKeyFormat: "camelcase" | "keep";
  // ES6 import statements, to override the
  prepend: string;

  schemaFile?: string;
  schemaDir?: string;
  outDir?: string;
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
  schemaFile: fileConfig.schemaFile,
  schemaDir: fileConfig.schemaDir,
  outDir: fileConfig.outDir,
};

const codegenOption = {
  prepend: config.prepend,
  formatObjectKeys:
    config.objectKeyFormat === "camelcase" ? camelcase : undefined,
};

if (config.schemaFile) {
  outputSingleToConsole(config.schemaFile);
} else if (config.outDir && config.schemaDir) {
  buildProject(config.schemaDir, config.outDir);
} else {
  throw new Error(
    `Invalid configuration. Please provide either schemaFile or schemaDir and outDir`
  );
}

function buildProject(schemaDir: string, outDir: string) {
  // https://stackoverflow.com/a/69867053
  // $1 imported variables
  // $2 quotes used for the import
  // $3 import path

  const importStatementRegex =
    // eslint-disable-next-line no-useless-escape
    /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/;

  // get the parsed generated typescript path for a given mol file
  function getOutputPath(molPath: string): string {
    const outputRelativePath = molPath
      .replace(schemaDir, "") // do not include the schemaDir in the output path
      .replace(/.mol$/, ".ts"); // replace the file extension

    return path.join(outDir, outputRelativePath);
  }

  // remove the trailing slash for both windows and *nix
  schemaDir = schemaDir.replace(/[\\/]+$/, "");

  const namedSchemas = globSync(
    path.join(schemaDir, "**/*.mol")
  ).map<ProjectSchemaOptions>((molPath) => {
    const prepend = (() => {
      const match = config.prepend.match(importStatementRegex);
      if (!match) return "";

      const [_, importVariables, quote, importPath] = match;

      if (!importPath.startsWith(".")) {
        return `import ${importVariables} from ${quote}${importPath}${quote}`;
      }
      const relativePath = relative(getOutputPath(molPath), importPath);
      return `import ${importVariables} from ${quote}${relativePath}${quote}`;
    })();

    return {
      path: molPath.replace(schemaDir, ""),
      content: fs.readFileSync(molPath, "utf-8"),
      formatObjectKeys: codegenOption.formatObjectKeys,
      prepend: prepend,
    };
  });

  codegenProject(namedSchemas).forEach(({ path: molPath, content }) =>
    writeFile(getOutputPath(molPath), content)
  );
}

function outputSingleToConsole(schemaFile: string) {
  const generated = codegen(
    fs.readFileSync(schemaFile, "utf-8"),
    codegenOption
  );

  console.log(generated);
}
