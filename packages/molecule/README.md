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

> Note: if you find the npx lumos-molecule-codegen command is not found, please try to replace npx with `node_modules/.bin/lumos-molecule-codegen`.

### Single File

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

### Codegen Directory

To generate all the molecule files in a directory that match the pattern of `**/*.mol`, you can use the following configuration.

```json5
{
  // keep | camelcase
  objectKeyFormat: "camelcase",
  // prepend the import statement to custom and override the generated codec
  // to make the relative import work, you need to run the command in the same directory as the `customized` directory
  prepend: "import { Uint32, Uint64, Uint128 } from './customized'",
  // the input schema directory, all **/*.mol in the directory will be processed
  schemaDir: "schemas",
  // the output directory
  outDir: "generated",
}
```

Then run the following command to generate code to the `generated` directory.

```sh
npx lumos-molecule-codegen
```

## Known Issues

The parser inside `@ckb-lumos/molecule` is based on the [EBNF](https://github.com/nervosnetwork/molecule/blob/37748b1124181a3260a0668693c43c8d38c98723/docs/grammar/grammar.ebnf), but the Rust implementation is based on the [Pest](https://github.com/nervosnetwork/molecule/blob/37748b1124181a3260a0668693c43c8d38c98723/tools/codegen/src/grammar.pest), there are some differences between them, such as

- comment starts with `#`
- comment defined in the `struct`, `table`, or `union` is not supported well

Therefore, to use `lumos-molecule-codegen`, you need to make sure the comments should not be placed 
