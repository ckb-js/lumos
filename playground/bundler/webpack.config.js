const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: { output: "./src/index.ts" },
  output: {
    path: path.join(__dirname, "lib"),
    filename: "lumos.min.js",
    library: "lumos",
    libraryTarget: "umd",
    globalObject: "this",
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader", options: {} }],
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  infrastructureLogging: { level: "verbose" },
  plugins: [new ForkTsCheckerWebpackPlugin({ async: false })],
};
