const path = require("path");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    output: "./src/index.ts",
  },
  output: {
    path: path.join(__dirname, "lib"),
    filename: "lumos.umd.js",
    library: "lumos",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    fallback: {
      // https://www.npmjs.com/package/buffer#usage
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      path: false,
      fs: false,
      stream: false,
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ async: false }),
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
  ],
};
