const shell = require("shelljs");
const lernaJson = require("../lerna.json");

let branch = 'v' + lernaJson.version;
if (/alpha/.test(lernaJson.version)) {
  branch = 'next/' + branch;
}

shell.exec(`git checkout -b ${branch}`)
shell.exec(`git add . && git commit -m \"chore: publish ${lernaJson.version}\"`)


