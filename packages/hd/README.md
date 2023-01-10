# `@ckb-lumos/hd`

HD & Mnemonic implementation for lumos.

## Usage

Create a new HD wallet.

```javascript
const { mnemonic, ExtendedPrivateKey, Keystore } = require("@ckb-lumos/hd")
const m = mnemonic.generateMnemonic()
const seed = mnemonic.mnemonicToSeedSync(m)
const extendedPrivateKey = ExtendedPrivateKey.fromSeed(seed)
const keystore = Keystore.create(extendedPrivateKey, "Your password")
// save keystore file
keystore.save("you path, only dir")

// load keystore file
const keystore = Keystore.load("you file path, with file name")
```

XPub support.
```javascript
const { XPubStore } = require("@ckb-lumos/hd")

// load from xpub file.
const xpub = XPubStore.load("you path")

// to AccountExtendedPublicKey
const accountExtendedPublicKey = xpub.toAccountExtendedPublicKey()

// save xpub file.
xpub.save("your path")
```
## Browsers

This package enforces key management by importing `buffer`, `stream`, `crypto`, `fs` and `path` packages, which are not available in browser environment. If you want to use '@lumos/hd' in your front-end project, please include polyfill to your project module bundle. Here is a webpack example:

```js
resolve: {
  ...
  fallback: {
    fs: false,
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    crypto: require.resolve('crypto-browserify'),
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
}
```

You'll need to install `buffer`, `stream-browserify`, `path-browserify` and `crypto-browserify` also.
