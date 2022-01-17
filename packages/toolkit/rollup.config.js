import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

import * as package_json from "./package.json";

const isProduction = process.env.BUILD === 'production';
const outputFolder = "lib";
const sourcemap = !isProduction;

module.exports = [
  {
    input: "src/index.js",
    output: {
      file: outputFolder + "/ckb-js-toolkit.node.js",
      format: "cjs",
      sourcemap: true
    },
    plugins: [
      replace({__development_build__: package_json.version}),
      resolve({preferBuiltins: true}),
      commonjs(),
      isProduction && terser()
    ]
  },
  // TODO: do we need sourcemap for UMD and ESM versions?
  {
    input: "src/index.js",
    output: {
      file: outputFolder + "/ckb-js-toolkit.umd.js",
      format: "umd",
      name: "CKBJSToolkit",
      sourcemap: sourcemap
    },
    plugins: [
      replace({__development_build__: package_json.version}),
      resolve({browser: true, preferBuiltins: false}),
      commonjs(),
      isProduction && terser()
    ]
  },
  {
    input: "src/index.js",
    output: {
      file: outputFolder + "/ckb-js-toolkit.esm.js",
      format: "esm",
      sourcemap: sourcemap
    },
    plugins: [
      replace({__development_build__: package_json.version}),
      resolve({browser: true, preferBuiltins: false}),
      commonjs(),
      isProduction && terser()
    ]
  }
];
