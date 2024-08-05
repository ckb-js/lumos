/*
The test
using the Molecule schema from [types.mol](https://github.com/nervosnetwork/molecule/blob/4988418dd65c398b5eab2bc22bc125b72ceeb4b9/test/schemas/types.mol) and corresponding vector from [simple.yaml](https://github.com/nervosnetwork/molecule/blob/4988418dd65c398b5eab2bc22bc125b72ceeb4b9/test/vectors/simple.yaml).
This test checks if the generated code works as expected by running `pack(unpack(item)) == expected`.

To run the test from scratch, please make sure the pwd is `/path/to/lumos/packages/molecule/tests/codegen`

```sh
node ../../lib/cli > generated.ts
```
*/

import test from "ava";
import path from "node:path";
import * as fs from "node:fs";
import { load } from "js-yaml";
import * as generated from "./generated";
import { AnyCodec, bytes } from "@ckb-lumos/codec";

test("Test codegen examples", () => {
  const yamlItems = load(
    fs.readFileSync(path.join(__dirname, "tests/simple.yaml")).toString()
  ) as any[];

  const x = yamlItems.map((testCase) => {
    let data: object | string[] | undefined = undefined;
    if (Array.isArray(testCase.data)) {
      data = testCase.data.map((dataItem: any) =>
        dataItem.replace(/[_/]/gi, "")
      );
    } else if (typeof testCase.data === "object") {
      data = {};
      Object.entries(testCase.data).forEach((testCaseDataEntry) => {
        Object.assign(data as object, {
          [testCaseDataEntry[0]]: (testCaseDataEntry[1] as string).replace(
            /[_/]/gi,
            ""
          ),
        });
      });
    }
    let caseItem: object | string | undefined = undefined;
    if (typeof testCase.item === "string") {
      caseItem = testCase.item.replace(/[_/]/gi, "");
    } else if (typeof testCase.item === "object") {
      caseItem = {};
      Object.entries(testCase.item).forEach((testCaseItemEntry) => {
        Object.assign(caseItem as object, {
          [testCaseItemEntry[0]]: (testCaseItemEntry[1] as string).replace(
            /[_/]/gi,
            ""
          ),
        });
      });
    }
    return {
      name: testCase.name as keyof typeof generated,
      data,
      item: caseItem,
      expected: testCase.expected.replace(/[_/]/gi, ""),
    };
  });

  x.forEach(({ name, expected }) => {
    // eslint-disable-next-line import/namespace
    const c = generated[name] as AnyCodec;
    console.log(bytes.equal(c.pack(c.unpack(expected)), expected));
  });
});
