// If indexer is included in a yarn workspace environment, try runs
// symlink_node_modules script. See `scripts/symlink_node_modules.js`
// for more details.

const fs = require("fs");
const path = require("path");
const { exec } = require("./common");

const file = path.resolve(
  path.join(__dirname, "../../../scripts/symlink_node_modules.js")
);

if (!fs.existsSync(file)) {
  return;
}

exec("node", [file]);
