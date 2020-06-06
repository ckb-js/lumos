const spawn = require("child_process").spawn;

const args = ["install"];
if (process.env.LUMOS_NODE_RUNTIME === "electron") {
  args.push("--runtime=electron");
  args.push(`--target=${process.argv[2]}`);
}
args.push("--fallback-to-build=false");

console.log(`node-pre-gyp args: ${args.join(" ")}`);

function exitWithError(data) {
  console.error(data);
  process.exit(1);
}

let stderr = "";
spawn("node-pre-gyp", args, {
  stdio: "inherit",
  shell: true,
})
  .on("error", function (err) {
    exitWithError(`Install binary error: ${err}, stderr: ${stderr}`);
  })
  .on("close", function (code) {
    if (code !== 0 || stderr.indexOf("ERR") !== -1) {
      exitWithError(`Install binary error, code: ${code}, stderr: ${stderr}`);
    }
    process.exit(0);
  })
  .on("data", function (data) {
    stderr += String(data);
  });
