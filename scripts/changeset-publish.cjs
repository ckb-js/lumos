const { execSync } = require("node:child_process");
const path = require("node:path");

const pkgJson = require(path.join(__dirname, "../packages/lumos/package.json"));
const currentVersion = pkgJson.version;

const tagged = execSync(`git ls-remote --tags`)
  .toString()
  .includes(`v${currentVersion}`);

/** @type {string[]} */
const commands = [
  `changeset publish --no-git-tag`,
  !tagged && `git tag v${currentVersion}`,
].filter(Boolean);

execSync(commands.join(" && "), { stdio: "inherit" });
