#!/usr/bin/env node
import { ParseResult } from "./type";
import { codegenReturnMore } from "./codegen";
import * as fs from "node:fs";
import * as path from 'path';

const DEFAULT_CONFIG_FILE_NAME = process.env.CONF_PATH || "lumos-molecule-codegen.json";

function camelcase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

type Config = {
  objectKeyFormat: "camelcase" | "keep";
  prepend: string;
  schemaFile: string;
  output: number; // 0: Default out console, 1: Write file, 2. Just return
  dir: string; // 
};

const fileConfig: Partial<Config> = (() => {
  console.log(DEFAULT_CONFIG_FILE_NAME)
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
  dir: fileConfig.dir || __dirname
};

// check if the schema file exists
// if (!fs.existsSync(config.schemaFile)) {
//   console.error(
//     `Schema file ${config.schemaFile} does not exist. Please configure the \`schemaFile\` in ${DEFAULT_CONFIG_FILE_NAME}`
//   );
//   process.exit(1);
// }

// const generated = codegen(fs.readFileSync(config.schemaFile, "utf-8"), {
//   prepend: config.prepend,
//   formatObjectKeys:
//     String(config.objectKeyFormat).toLowerCase() === "camelcase" ? camelcase : undefined,
// });

// console.log(generated);

// const scanedFiles: Set<string>  = new Set()
const fileImportsMap: Map<string, Array<string>> = new Map()
const fileStack: Array<string> = []
const genResult: Map<string, ParseResult> = new Map()

function scanImports(filename: string): Array<string> {
  // check if the file exist
  if (!fs.existsSync(filename)) {
    console.error(
      `Schema file ${filename} does not exist.`
    );
    process.exit(1);
  }
  const schema = fs.readFileSync(filename, "utf-8")
  if (!schema) return [];

  const matched = schema.match(/.*import\s+"(.*)".*;/g);
  if (!matched) return [filename];

  // collect all import filenames
  const importFileNames = matched.map((item: string) => { 
    // if is commit bolck, continue
    if (item.trim().startsWith('//')) {
      return ''
    }
    const m = item.match(/.*"(.*)".*/);
    return m ? m[1] : '' 
  }).filter(Boolean)

  // push filename to stack
  fileStack.push(filename)
  // loop all import files
  const baseDir = path.dirname(filename)
  for (const importFileName of importFileNames) {
    const mFilePath = path.join(baseDir, importFileName + '.mol')
  
    if (!fileImportsMap.has(mFilePath)) {
      // mask this file has checked
      fileImportsMap.set(mFilePath, [])
      // recursive next
      scanImports(mFilePath)
    }
    fileStack.push(mFilePath)
  }
  // recard import names for ESM import
  fileImportsMap.set(filename, importFileNames)

  return fileStack
}

function loopCodegen(targetFilename: string): Map<string, ParseResult> {
  scanImports(targetFilename)
  // TODO check all schema can parseable
  if (fileStack.length === 0) {
    // console.log('Empty file list for codegen')
    return genResult
  }

  const sourceDir = path.dirname(targetFilename)

  while (fileStack.length > 0) {
    const filename = fileStack.pop()
    // console.log(filename)
    if (!filename) { break }

    const name = path.relative(sourceDir, filename).split('.')[0]
    // path.basename(filename).split('.')[0]
    // has gen, contine
    if (genResult.has(name)) {
      continue
    }
    // erase the import clause from the schema when calling the codegen method
    const schema = fs.readFileSync(filename, "utf-8")
    const lines = schema.split('\n')
    const delImportLines = lines.filter((line: string) => { 
      return !line.trim().startsWith('import') 
    })

    let optionPrepend = config.prepend
    // append all ESM import to config.prepend
    if (fileImportsMap.has(filename)) {
      const imports = fileImportsMap.get(filename)
      if (imports && imports?.length > 0) {
        for (const impt of imports) {
          if (genResult.has(impt)){
            // console.log('ok 4', genResult.get(impt))
            const imptDesc = `\nimport { ${genResult.get(impt)?.fields.join(', ')} } from './${impt}'`
            optionPrepend += imptDesc
          }
        }
      }
    }
    
    const result = codegenReturnMore(delImportLines.join('\n'), {
      prepend: optionPrepend , // ex: `\nimport { RGB, UTF8String } from './base'`,
      formatObjectKeys:
        String(config.objectKeyFormat).toLowerCase() === "camelcase" ? camelcase : undefined,
    });
    
    genResult.set(name, result)

  }
  
  // console.log(config.dir, config.output)
  for (const name of genResult.keys()) {
    if (config.output < 2) {
      console.log(`// ${String('-').repeat(66)} //`)
      console.log(`// ${name}`)
      console.log(`// ${String('-').repeat(66)} //`)
      console.log(genResult.get(name)?.code)
      if (config.output === 1) {
        const dir = path.join(config.dir, 'mols')
        if (!fs.existsSync(dir)) {
          console.log(`Mkdir mols`)
          fs.mkdirSync(dir)
        }
        const targetDir = path.dirname(path.join(dir, name + '.ts'))
        if (!fs.existsSync(targetDir)) {
          console.log(`Mkdir ${targetDir}`)
          fs.mkdirSync(targetDir, { recursive: true })
        }
        console.log(`Writing file ${name}.ts`)
        fs.writeFileSync(path.join(dir, name + '.ts'), genResult.get(name)?.code || '')
        console.log(`Write file ${name}.ts finish`)
      }
    }
  }

  return genResult
}

loopCodegen(config.schemaFile);


