# @ckb-lumos/crypto

Low-level cryptographic primitives for Lumos, works in both Node.js and browsers.

## Usage

The `package.json` defined the entry point for both Node.js and browsers. You can just import

```ts
import { createHash } from "@ckb-lumos/crypto";
```

### Manually

```typescript
// In Node.js
import { createHash } from "@ckb-lumos/crypto";
// In browsers
import { createHash } from "@ckb-lumos/crypto/lib/crypto-browser";
```
