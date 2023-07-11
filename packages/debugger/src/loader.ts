import { HexString, OutPoint } from "@ckb-lumos/base";
import * as fs from "fs";
import { ckbHash } from "@ckb-lumos/base/lib/utils";
import { hexify } from "@ckb-lumos/codec/bytes";
import { OutPoint as OutPointCodec, OutPointVec } from "./codecs";

export type LoadedCode = { codeHash: HexString; binary: HexString };

export function loadCode(binaryPath: string): LoadedCode {
  const buf = fs.readFileSync(binaryPath);
  return {
    codeHash: ckbHash(Uint8Array.from(buf).buffer),
    binary: hexify(buf),
  };
}

export class OutputDataLoader {
  private readonly cache: Map<HexString /* PackedOutPoint */, HexString>;

  constructor() {
    this.cache = new Map();
  }

  setCode(outPoint: OutPoint, path: string): LoadedCode {
    const loadedCode = loadCode(path);
    this.cache.set(hexify(OutPointCodec.pack(outPoint)), loadedCode.binary);
    return loadedCode;
  }

  setOutpointVec(outPoint: OutPoint, outPoints: OutPoint[]): void {
    this.cache.set(
      hexify(OutPointCodec.pack(outPoint)),
      hexify(OutPointVec.pack(outPoints))
    );
  }

  getOutputData(outPoint: OutPoint): HexString | undefined {
    return this.cache.get(hexify(OutPointCodec.pack(outPoint)));
  }
}
