# Migrate to ES Modules

ES module is the modern standard for JavaScript module system. It is supported by all major browsers and Node.js. It is also the default module system for TypeScript. However, Lumos currently only supports CommonJS module system. Supporting ES module will bring the following benefits:

- native support for ES module to use the [1k+ very common modules](https://github.com/sindresorhus/meta/discussions/15) without transpilation in Lumos
- work well with code splitting and tree shaking
  - import only the required code
  - improve the cold start time
- avoid users using non-exported APIs
  - the `exports` field in `package.json` to specify the entry point of the package

## How To Migrate

1. Check all of `@ckb-lumos/.*/lib` imports in your codebase
2. Replace them with `@ckb-lumos/[moduleName]/[subModuleName]` if possible

If you find there are some missing exports, please open an issue to let us know.

## I Don't Want To Migrate

If you don't want to migrate to ES module, you can use the following workaround:

1. install the [`patch-package`](https://github.com/ds300/patch-package)
2. add the `"postinstall": "patch-package"` script to your `package.json`
3. remove all `exports` fields in `node_modules/@ckb-lumos/*/package.json`
4. run `npx patch-package @ckb-lumos/lumos` or your changed package name
