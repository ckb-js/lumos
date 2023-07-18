const { execSync } = require("node:child_process");
const path = require("node:path");

const pkgJson = require(path.join(__dirname, "../packages/lumos/package.json"));
const currentVersion = pkgJson.version;

const commands = [
  `changeset publish --no-git-tag`,
  `git tag v${currentVersion}`,
];

execSync(commands.join(" && "), { stdio: "inherit" });
