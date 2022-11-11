# CRA, Vite, Webpack or Other

## Webpack 5.x

In Webpack V5, it doesn't provide default polyfills for NodeJS API. You need to add the following config to
your `webpack.config.js`
.([Webpack `resolve.fallback` official document](https://webpack.js.org/configuration/resolve/#resolvefallback))

- install `crypto-browserify` and `buffer` dependencies.

```bash
npm install -D crypto-browserify buffer
# or use yarn
yarn install -D crypto-browserify buffer
```

- add `resolve.fallback` to tell Webpack where to find the polyfills.
- add `webpack.ProvidePlugin` to tell Webpack to inject the polyfills to the global scope.

Update your `webpack.config.js`:

```js
module.exports = {
  // ...other config
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      path: false,
      fs: false,
      stream: false,
    },
  },

  plugins: [
    // ...your origin plugin for webpack
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
  ],
}
```

## Create React App

[Create React App](https://create-react-app.dev/) build system based on Webpack, but need some patch
via `react-app-rewired`

First install `react-app-rewired`, `crypto-browserify` and `buffer` dependencies.

```bash
npm install -D react-app-rewired crypto-browserify buffer
# or use yarn
yarn install -D react-app-rewired crypto-browserify buffer
```

Then create a `config-overrides.js` file in yout root directory of project. and add the following code to it.

```js
const webpack = require("webpack")
module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    buffer: require.resolve("buffer/"),
    path: false,
    fs: false,
    stream: false,
  }

  config.plugins = [...config.plugins, new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] })]

  return config
}
```

Finally, override the `scripts` field in `package.json` to use `react-app-rewired`.

```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build",
    "test": "react-app-rewired test"
  }
}
```

Also, [eject `create-react-app`](https://create-react-app.dev/docs/available-scripts/#npm-run-eject) is available,
after do it, see [Webpack polyfills Section](#Webpack) to config.

## Vite

Please follow these step.

- add [rollup-plugin-polyfill-node](https://www.npmjs.com/package/rollup-plugin-polyfill-node) and
  [@rollup/plugin-inject](https://www.npmjs.com/package/@rollup/plugin-inject)

```
npm install -D rollup-plugin-polyfill-node @rollup/plugin-inject
```

- config `vite.config.js`

```js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import inject from "@rollup/plugin-inject"
import nodePolyfills from "rollup-plugin-polyfill-node"
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // add node polyfills
    nodePolyfills(),

    // inject Buffer to global
    inject({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
})
```

## Docusaurus

Docusaurus also packs project via webpack, so we just need to tell Docusaurus webpack that the following configuration
needs to be added

```js
// docusaurus.config.js

module.exports = {
  plugins: [
    () => ({
      name: "node-polyfill",
      configureWebpack() {
        return {
          resolve: {
            fallback: {
              crypto: require.resolve("crypto-browserify"),
              buffer: require.resolve("buffer/"),
              path: false,
              fs: false,
              stream: false,
            },
          },
          plugins: [new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] })],
        }
      },
    }),
  ],
}
```
