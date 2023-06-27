import { exec } from "node:child_process";
import { promisify } from "node:util";
import { cp, rm, writeFile, access, readFile } from "node:fs/promises";
import { join } from "node:path";
import yargs from "yargs/yargs";

const execAsync = promisify(exec);

const TYPE_TMP_DIR = "_types_tmp";

async function buildTypes(dirs: string[]) {
  await execAsync(
    `tsc --declaration --emitDeclarationOnly --outDir ${TYPE_TMP_DIR}`
  );
  await Promise.all(
    dirs.map((dir) => cp(TYPE_TMP_DIR, dir, { recursive: true }))
  );
  await rm(TYPE_TMP_DIR, { recursive: true });
}

// build ESM output, if a package.esm.json exists, use it as package.json
async function buildEsm(outDir: string) {
  await execAsync(
    `MODULE=esm babel --root-mode upward src --out-dir ${outDir} --extensions .ts -s`
  );

  const packageJson = await access("package.esm.json").then(
    () => readFile("package.esm.json"),
    () => JSON.stringify({ type: "module" })
  );

  // mark package.json as module
  await writeFile(join(outDir, "package.json"), packageJson);
}

async function main() {
  const argv = await yargs(process.argv.slice(2))
    .scriptName("lumos-build")
    .usage("$0 [args]")
    .option("esm", {
      type: "boolean",
      default: false,
      description: "Build ESM output",
    })
    .option("cjs", {
      type: "boolean",
      default: false,
      description: "Build CJS output",
    })
    .option("types", {
      type: "boolean",
      default: false,
      description: "Build Types output",
    })
    .option("esmOutDir", {
      type: "string",
      default: "lib.esm",
      description: "Output directory for ESM build",
    })
    .option("cjsOutDir", {
      type: "string",
      default: "lib",
      description: "Output directory for CJS build",
    }).argv;

  //  "build": "run-p build:*",
  //   "build:types": "tsc --declaration --emitDeclarationOnly",
  //   "build:js": "MODULE=cjs babel --root-mode upward src --out-dir lib --extensions .ts -s",
  //   "build:esm": "MODULE=esm babel --root-mode upward src --out-dir lib.esm --extensions .ts -s",

  // prettier-ignore
  await Promise.all([
    argv.esm && buildEsm(argv.esmOutDir),
    argv.cjs && execAsync(`MODULE=cjs babel --root-mode upward src --out-dir ${argv.cjsOutDir} --extensions .ts -s`),
    argv.types && buildTypes([
      argv.esm ? argv.esmOutDir : '',
      argv.cjs ? argv.cjsOutDir : ''
    ].filter(Boolean))
  ].filter(Boolean));
}

main();
