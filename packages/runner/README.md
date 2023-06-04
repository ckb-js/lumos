# @ckb-lumos/runner

This package provides a JavaScript interface for interacting with the CKB related released binaries.

## Example

```typescript
import { ckb, download } from '@ckb-lumos/runner'

await download(ckb.getReleaseUrl(), 'path/to/a/directory')
const ckbBinaryPath = ckb.findBinaryPath('path/to/a/directory')

ckb.generateConfigSync(ckbBinaryPath, { ckbPort: 8114 })
spawn(ckbBinaryPath, ['--help'])
```
