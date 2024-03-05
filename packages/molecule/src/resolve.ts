#!/usr/bin/env node
import { ParseResult } from "./type";
import { codegenReturnWithElements } from "./codegen";
import { Config } from "./config";
import * as fs from "node:fs";
import * as path from "path";

function camelcase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export type RelativePath = string;
export type FileWithDependence = {
  relativePath: string;
  dependencies: string[];
};

export function resolveDependencies(
  importPath: RelativePath,
  baseDir: string,
  resolved: Set<RelativePath>
): FileWithDependence[] {
  const dependencies: FileWithDependence[] = [];
  // check if the file exist
  const realPath = path.join(baseDir, importPath);
  if (!fs.existsSync(realPath)) {
    console.error(`Schema file ${realPath} does not exist.`);
    process.exit(1);
  }

  const cur: FileWithDependence = {
    relativePath: importPath,
    dependencies: [],
  };

  const schema = fs.readFileSync(realPath, "utf-8");
  if (!schema) {
    return [cur];
  }

  const matched = schema.match(/.*import\s+"(.*)".*;/g);
  if (!matched) {
    return [cur];
  }

  // collect all import filenames
  const importFileNames = matched
    .map((item: string) => {
      // if is comment statement, continue
      if (item.trim().startsWith("//")) {
        return "";
      }
      const m = item.match(/.*"(.*)".*/);
      return m ? m[1] : "";
    })
    .filter(Boolean);

  // loop all import files
  for (const importFileName of importFileNames) {
    const mFilePath = path.join(baseDir, importFileName + ".mol");
    const mRelativePath = path.relative(baseDir, mFilePath);

    cur.dependencies.push(importFileName);
    if (!resolved.has(mFilePath)) {
      // mask this file has resolved
      resolved.add(mFilePath);

      const _dependencies = resolveDependencies(
        mRelativePath,
        baseDir,
        resolved
      );
      dependencies.push(..._dependencies);
    }
  }

  dependencies.push(cur);

  return dependencies;
}

export function extractAndEraseImportClauses(code: string): string {
  const lines = code.split("\n");
  const delImportLines = lines.filter((line: string) => {
    return !line.trim().startsWith("import");
  });
  return delImportLines.join("\n");
}

function printOrWrite(resultMap: Map<string, ParseResult>, config: Config) {
  for (const name of resultMap.keys()) {
    if (config.output < 2) {
      console.log(`// ${String("-").repeat(66)} //`);
      console.log(`// generate from ${name}`);
      console.log(`// ${String("-").repeat(66)} //`);
      console.log(resultMap.get(name)?.code);
      if (config.output === 1) {
        const dir = path.join(config.dir, "mols");
        if (!fs.existsSync(dir)) {
          console.log(`mkdir mols`);
          fs.mkdirSync(dir);
        }
        const tsName = name.replace(".mol", ".ts");
        const targetDir = path.dirname(path.join(dir, tsName));
        if (!fs.existsSync(targetDir)) {
          console.log(`mkdir ${targetDir}`);
          fs.mkdirSync(targetDir, { recursive: true });
        }
        console.log(`writing file ${tsName}`);
        fs.writeFileSync(
          path.join(dir, tsName),
          resultMap.get(name)?.code || ""
        );
        console.log(`write file ${tsName} finish`);
      }
    }
  }
}

export function loopCodegen(config: Config): Map<string, ParseResult> {
  const result: Map<string, ParseResult> = new Map();
  const baseDir = path.dirname(config.schemaFile);
  const relativePath = path.basename(config.schemaFile);
  const dependencies = resolveDependencies(relativePath, baseDir, new Set());

  if (dependencies.length === 0) {
    return result;
  }

  const parsed: Set<string> = new Set();
  dependencies.forEach((cur) => {
    // has generated, continue
    if (parsed.has(cur.relativePath)) {
      return;
    }

    // erase the import clause from the schema when calling the codegen method
    const realPath = path.join(baseDir, cur.relativePath);
    const schema = extractAndEraseImportClauses(
      fs.readFileSync(realPath, "utf-8")
    );

    let optionPrepend = config.prepend;
    // append all ESM import to config.prepend

    for (const importName of cur.dependencies) {
      const importAbsolutePath = path.join(
        path.dirname(realPath),
        importName + ".mol"
      );
      const importRelativePath = path.relative(baseDir, importAbsolutePath);

      if (result.has(importRelativePath)) {
        const imptDesc = `\nimport { ${result
          .get(importRelativePath)
          ?.elements.join(", ")} } from './${importName}'`;
        optionPrepend += imptDesc;
      }
    }

    const codegenReturn = codegenReturnWithElements(schema, {
      prepend: optionPrepend,
      formatObjectKeys:
        String(config.objectKeyFormat).toLowerCase() === "camelcase"
          ? camelcase
          : undefined,
    });

    parsed.add(cur.relativePath);
    result.set(cur.relativePath, codegenReturn);
  });

  printOrWrite(result, config);

  return result;
}
