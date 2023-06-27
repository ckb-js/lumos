"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const yargs_1 = __importDefault(require("yargs/yargs"));
const execAsync = (0, node_util_1.promisify)(node_child_process_1.exec);
const TYPE_TMP_DIR = "_types_tmp";
async function buildTypes(dirs) {
    await execAsync(`tsc --declaration --emitDeclarationOnly --outDir ${TYPE_TMP_DIR}`);
    await Promise.all(dirs.map((dir) => (0, promises_1.cp)(TYPE_TMP_DIR, dir, { recursive: true })));
    await (0, promises_1.rm)(TYPE_TMP_DIR, { recursive: true });
}
// build ESM output, if a package.esm.json exists, use it as package.json
async function buildEsm(outDir) {
    await execAsync(`MODULE=esm babel --root-mode upward src --out-dir ${outDir} --extensions .ts -s`);
    const packageJson = await (0, promises_1.access)("package.esm.json").then(() => (0, promises_1.readFile)("package.esm.json"), () => JSON.stringify({ type: "module" }));
    // mark package.json as module
    await (0, promises_1.writeFile)((0, node_path_1.join)(outDir, "package.json"), packageJson);
}
async function main() {
    const argv = await (0, yargs_1.default)(process.argv.slice(2))
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
