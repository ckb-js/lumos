const { exec } = require("./common");
const version = process.env.LUMOS_NODE_RUNTIME_VERSION;
if (!version) {
  throw new Error("Electron runtime version must be defined!");
}

exec("node-pre-gyp", ["package", "--runtime=electron", `--target=${version}`]);
