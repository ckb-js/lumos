# Migrate to Lumos v0.24

## BREAKING: Buffer replaced by Uint8Array

**Lumos can now run in browsers without any extra configs / polyfills with vite, webpack or create-react-app.**

### `Buffer` was return type

Methods / functions used to return a `Buffer` now returns a `Uint8Array`, e.g. In `@ckb-lumos/hd`

```diff
- export function privateToPublic(privateKey: Buffer | HexString): Buffer | HexString
+ export function privateToPublic(privateKey: Uint8Array | HexString): Uint8Array | HexString

- export function mnemonicToSeedSync(mnemonic = "", password = ""): Buffer
+ export function mnemonicToSeedSync(mnemonic = "", password = ""): Uint8Array

- export function mnemonicToSeed(mnemonic = "", password = ""): Promise<Buffer>
+ export function mnemonicToSeed(mnemonic = "", password = ""): Promise<Uint8Array>
```

You can use the `hexify` method from `@ckb-lumos/lumos/codec` to replace `buffer.toString('hex')`

```diff
- "0x" + privateToPublick(privKey).toString('hex')
+ hexify(privateToPublic(privKey))
```

**Notice:** `hexify` returns `HexString` which starts with `'0x'` while `buffer.toString('hex')` result has **no** `'0x'` prefix.

Same for `@ckb-lumos/hd/KeyStore`

```diff
export default class Keystore {
  ...
- derivedKey(password: string): Buffer
+ derivedKey(password: string): Uint8Array
  ...
}
```

### `Buffer` was parameter type

You can still pass in `Buffer` because `Buffer` is a subclass of `Uint8Array`, but using `Uint8Array` is recomended.

`@ckb-lumos/hd/KeyChain`

```diff
export default class Keychain {
  ...
- constructor(privateKey: Buffer, chainCode: Buffer)
+ constructor(privateKey: Uint8Array, chainCode: Uint8Array)
  ...
- hash160(data: Buffer): Buffer
+ hash160(data: Uint8Array): Uint8Array
}
```

`@ckb-lumos/hd/KeyStore`

```diff
export default class Keystore {
  ...
  static create(
      extendedPrivateKey: ExtendedPrivateKey,
      password: string,
-     options: { salt?: Buffer; iv?: Buffer } = {}
+     options: { salt?: Uint8Array; iv?: Uint8Array } = {}
    ): Keystore
  ...
- static mac(derivedKey: Buffer, ciphertext: Buffer): HexStringWithoutPrefix
+ static mac(derivedKey: Uint8Array, ciphertext: Uint8Array): HexStringWithoutPrefix
}
```

## BREAKING: Disallow the Omnilock P2SH Address by Default

The default options of `createOmnilockScript` disallows the use of P2SH addresses for security reasons.
Not all P2SH addresses are P2SH-P2WPKH addresses.
This means that developers may unintentionally use a non-P2SH-P2WPKH address to convert to an Omnilock script,
which can lead to the script not being lockable.
If you still need to use a P2SH address, use the following code

```diff
createOmnilockScript({
  auth: {
    flag: "BITCOIN",
    content: addr,
+   allows: ["P2WPKH", "P2PKH", "P2SH-P2WPKH"]
  }
})
```
