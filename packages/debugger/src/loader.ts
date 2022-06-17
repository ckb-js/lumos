import { HexString } from "@ckb-lumos/base";
import * as fs from "fs";
import { ckbHash } from "@ckb-lumos/base/lib/utils";
import { hexify } from "@ckb-lumos/codec/lib/bytes";

export function loadCode(
  binaryPath: string
): { codeHash: HexString; binary: HexString } {
  const buf = fs.readFileSync(binaryPath);
  return {
    codeHash: ckbHash(Uint8Array.from(buf).buffer).serializeJson(),
    binary: hexify(buf),
  };
}
