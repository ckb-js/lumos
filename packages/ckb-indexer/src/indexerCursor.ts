import { HexNumber, Script } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

export type IndexerCursor = {
  searchType: "lock" | "type";
  script: Script;
  blockNumber: string;
  txIndex: HexNumber;
  outputIndex: HexNumber;
};

export function encodeCursor(cursor: IndexerCursor): string {
  const prefix =
    cursor.searchType === "lock" ? Buffer.from("0x04") : Buffer.from("0x06");
  const codeHash = Buffer.from(cursor.script.codeHash, "hex");
  const hashType = Buffer.from(
    cursor.script.hashType === "type" ? "0x00" : "0x01",
    "hex"
  );
  const args = Buffer.from(cursor.script.args, "hex");
  const blockNumber = Buffer.from(cursor.blockNumber, "hex");
  const txIndex = Buffer.from(cursor.txIndex, "hex");
  const outputIndex = Buffer.from(cursor.outputIndex, "hex");
  return bytes.hexify(
    Buffer.concat([
      prefix,
      codeHash,
      hashType,
      args,
      blockNumber,
      txIndex,
      outputIndex,
    ])
  );
}

export function decodeCursor(cursorStr: string): IndexerCursor {
  const buff = Buffer.from(cursorStr, "hex");
  const prefix = buff.subarray(0, 1);
  const codeHash = buff.subarray(1, 33);
  const hashType = buff.subarray(33, 34);
  const args = buff.subarray(34, buff.length - 17);
  const blockNumber = buff.subarray(-17, -9);
  const txIndex = buff.subarray(-9, -5);
  const outputIndex = buff.subarray(-5, -1);
  return {
    searchType: bytes.hexify(prefix) === "0x04" ? "lock" : "type",
    script: {
      codeHash: bytes.hexify(codeHash),
      hashType: bytes.hexify(hashType) === "0x00" ? "type" : "data",
      args: bytes.hexify(args),
    },
    blockNumber: bytes.hexify(blockNumber),
    txIndex: bytes.hexify(txIndex),
    outputIndex: bytes.hexify(outputIndex),
  };
}
