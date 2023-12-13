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
