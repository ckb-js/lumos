// If indexer is included in a yarn workspace environment, try runs
// symlink_node_modules script. See `scripts/symlink_node_modules.js`
// for more details.

const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");

const file = path.resolve(
  path.join(__dirname, "../../../scripts/symlink_node_modules.js")
);

if (!fs.existsSync(file)) {
  return;
}

function exitWithError(data) {
  console.error(data);
  process.exit(1);
}

let stderr = "";
spawn("node", [file], {
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
