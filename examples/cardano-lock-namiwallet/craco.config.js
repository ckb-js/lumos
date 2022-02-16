const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: false,
        lazyCompilation: true,
        syncWebAssembly: true,
        topLevelAwait: true,
      };
      webpackConfig.resolve.fallback = {
        buffer: require.resolve("buffer/"),
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });
      webpackConfig.plugins.push(new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }));

      return webpackConfig;
    },
  },
};
