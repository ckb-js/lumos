const buildCjs = process.env.MODULE === "cjs";
const buildEsm = process.env.MODULE === "esm";

const presets = [
  [
    "@babel/preset-env",
    {
      targets: {
        chrome: "79",
      },
      ...(buildEsm ? { modules: false } : {}),
    },
  ],
  "@babel/preset-typescript",
];

const plugins = [
  buildCjs && "@babel/plugin-proposal-export-namespace-from",
  buildCjs && "@babel/plugin-transform-modules-commonjs",
  require.resolve("babel-plugin-add-import-extension"),
].filter(Boolean);

module.exports = { presets, plugins: plugins };
