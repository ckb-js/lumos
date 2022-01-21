module.exports = {
  mode: "modules",
  out: "docusaurus/website/build/api",
  exclude: [
    "**/node_modules/**",
    "**/tests/**/*",
    "**/examples/**/*",
    "**/docusaurus/**/*",
    "**/examples/**/*",
    "**/docusaurus/**/*",
    "**/experiment/**/*",
  ],
  name: "lumos",
  includeDeclarations: true,
  excludePrivate: true,
  "external-modulemap": ".*packages/([^/]+)/.*",
  esModuleInterop: true,
};
