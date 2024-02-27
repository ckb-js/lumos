# @ckb-lumos/molecule

A molecule parser written in JavaScript that helps developers to parse molecule into a codec map.

```js
const { createParser } = require("@ckb-lumos/molecule");

const parser = createParser();
const codecMap = parser.parse(`
  array Uint8 [byte; 1];
`);

codecMap.Uint8.pack(1);
```

## `lumos-molecule-codegen`

A CLI to generate a set of TypeScript-friendly codec from a Molecule schema file.
To use it, you need to install `@ckb-lumos/molecule` and `@ckb-lumos/codec` first. The `@ckb-lumos/molecule` could be `devDependencies` if you only use it for codegen.

```sh
npm install -D @ckb-lumos/molecule
npm install @ckb-lumos/codec
```

Then you can create a `lumos-molecule-codegen.json` file to configure the codegen.

```json5
// lumos-molecule-codegen.json
{
  // keep | camelcase
  objectKeyFormat: "camelcase",
  // prepend the import statement to custom and override the generated codec
  prepend: "import { Uint32, Uint64, Uint128 } from './customized'",
  // the input schema file
  schemaFile: "blockchain.mol",
}
```

Finally, run the following command to generate code to write to `generated.ts`.

```sh
npx lumos-molecule-codegen > generated.ts
```
