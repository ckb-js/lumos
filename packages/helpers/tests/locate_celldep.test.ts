import test from "ava";
import { locateCellDep } from "../src/index";
import { CellDep, Script } from "@ckb-lumos/base";
import { shortAddressInfo } from "./addresses";

test("locate cellDep", (t) => {
  const script: Script = shortAddressInfo.script;
  const res = locateCellDep(script);
  const cellDep: CellDep = {
    depType: "depGroup",
    outPoint: {
      txHash:
        "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
      index: "0x0",
    },
  };
  t.deepEqual(res, cellDep);
});
