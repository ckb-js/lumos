# lumos-build

A package for building ESM and CJS output from a source directory.

## Quick Start

```
lumos-build --esm --cjs --types
```

Will build ESM, CJS, and Types output from the `src` directory
and place it in the `lib.esm`, `lib`, and `types` directories respectively.

## Overview

```
lumos-build [args]

Options:
  --help       Show help                                               [boolean]
  --version    Show version number                                     [boolean]
  --esm        Build ESM output                       [boolean] [default: false]
  --cjs        Build CJS output                       [boolean] [default: false]
  --types      Build Types output                     [boolean] [default: false]
  --esmOutDir  Output directory for ESM build      [string] [default: "lib.esm"]
  --cjsOutDir  Output directory for CJS build          [string] [default: "lib"]
```
