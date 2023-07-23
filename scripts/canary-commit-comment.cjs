// This script for generating a comment to a commit for canary release

const packageJson = require("../packages/lumos/package.json");
const version = packageJson.version;
const comment = `:rocket: New canary release: \`${version}\`
\`\`\`
npm install @ckb-lumos/lumos@${version}
\`\`\`
`;

console.log(comment);
