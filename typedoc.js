module.exports = {
  mode: "modules",
  out: "docs",
  exclude: ["**/node_modules/**", "**/tests/**/*.js"],
  name: "lumos",
  includeDeclarations: true,
  excludePrivate: true,
  "external-modulemap": ".*packages/([^/]+)/.*",
  esModuleInterop: true
};
