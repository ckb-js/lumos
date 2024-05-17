import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      path: false,
      stream: false,
    };

    config.plugins = [...config.plugins, new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] })];
    return config;
  },
};

export default nextConfig;
