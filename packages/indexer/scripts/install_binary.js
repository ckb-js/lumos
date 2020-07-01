const { exec, DEFAULT_LUMOS_VERSION } = require("./common");

const args = ["install"];
if (process.env.LUMOS_NODE_RUNTIME === "electron") {
  const version =
    process.env.LUMOS_NODE_RUNTIME_VERSION || DEFAULT_LUMOS_VERSION;
  args.push("--runtime=electron");
  args.push(`--target=${version}`);
}
args.push("--fallback-to-build=false");

console.log(`node-pre-gyp args: ${args.join(" ")}`);

exec("node-pre-gyp", args);
