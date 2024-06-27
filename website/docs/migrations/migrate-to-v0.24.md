# Migrate to Lumos v0.24

## Disallow the Omnilock P2SH Address by Default

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
