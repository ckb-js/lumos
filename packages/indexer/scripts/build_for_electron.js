const { exec } = require("./common");
const version = process.env.LUMOS_NODE_RUNTIME_VERSION;
if (!version) {
  console.log("Electron runtime version must be defined!");
  process.exit(1);
}

exec("electron-build-env", [
  "--electron",
  version,
  "--",
  "neon",
  "build",
  "--release",
]);
