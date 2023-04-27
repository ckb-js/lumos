import { HexNumber, Script } from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/bi";
import { bytes } from "@ckb-lumos/codec";
import { Uint32BE, Uint64BE } from "@ckb-lumos/codec/lib/number";

export type IndexerCursor = {
  searchType: "lock" | "type";
  script: Script;
  blockNumber: string;
  txIndex: HexNumber;
  outputIndex: HexNumber;
};

export function encodeCursor(cursor: IndexerCursor): string {
  const prefix =
    cursor.searchType === "lock" ? bytes.bytify("0x40") : bytes.bytify("0x60");
  const codeHash = bytes.bytify(cursor.script.codeHash);
  const hashType = bytes.bytify(
    // 0x00 for 'data', '0x01' for 'type', '0x02' for 'data1'
    cursor.script.hashType === "data"
      ? "0x00"
      : cursor.script.hashType === "type"
      ? "0x01"
      : "0x02"
  );
  const args = bytes.bytify(cursor.script.args);
  const blockNumber = Uint64BE.pack(cursor.blockNumber);
  const txIndex = Uint32BE.pack(cursor.txIndex);
  const outputIndex = Uint32BE.pack(cursor.outputIndex);

  return bytes.hexify(
    bytes.concat(
      prefix,
      codeHash,
      hashType,
      args,
      blockNumber,
      txIndex,
      outputIndex
    )
  );
}

export function decodeCursor(cursorStr: string): IndexerCursor {
  const buff = bytes.bytify(cursorStr);
  const buffLen = buff.length;
  const prefix = buff.subarray(0, 1);
  const codeHash = buff.subarray(1, 33);
  const hashType = buff.subarray(33, 34);
  const args = buff.subarray(34, buff.length - 16);
  const blockNumber = buff.subarray(-16, -8);
  const txIndex = buff.subarray(-8, -4);
  const outputIndex = buff.subarray(buffLen - 4, buffLen);

  return {
    searchType: bytes.hexify(prefix) === "0x40" ? "lock" : "type",
    script: {
      codeHash: bytes.hexify(codeHash),
      // 0x00 for 'data', '0x01' for 'type', '0x02' for 'data1'
      hashType:
        bytes.hexify(hashType) === "0x00"
          ? "data"
          : bytes.hexify(hashType) === "0x01"
          ? "type"
          : "data1",
      args: bytes.hexify(args),
    },
    blockNumber: BI.from(bytes.hexify(blockNumber)).toHexString(),
    txIndex: BI.from(bytes.hexify(txIndex)).toHexString(),
    outputIndex: BI.from(bytes.hexify(outputIndex)).toHexString(),
  };
}
