module.exports = {
  mode: "modules",
  out: "website/static/api",
  exclude: [
    "**/node_modules/**",
    "**/tests/**/*",
    "**/examples/**/*",
    "**/website/**/*",
    "**/examples/**/*",
  ],
  name: "lumos",
  includeDeclarations: true,
  excludePrivate: true,
  "external-modulemap": ".*packages/([^/]+)/.*",
  esModuleInterop: true,
};
