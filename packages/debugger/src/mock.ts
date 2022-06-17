import { OutPoint } from "@ckb-lumos/base";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import * as crypto from "crypto";

export function mockOutPoint(): OutPoint {
  return {
    tx_hash: hexify(crypto.randomBytes(32)),
    index: "0x0",
  };
}
