import { HexString } from "@ckb-lumos/base";

export function hexToByteArray(h: HexString): number[] {
  if (!/^(0x)?([0-9a-fA-F][0-9a-fA-F])*$/.test(h)) {
    throw new Error("Invalid hex string!");
  }
  if (h.startsWith("0x")) {
    h = h.slice(2);
  }
  const array = [];
  while (h.length >= 2) {
    array.push(parseInt(h.slice(0, 2), 16));
    h = h.slice(2);
  }
  return array;
}

export function byteArrayToHex(a: number[]): HexString {
  return "0x" + a.map((i) => ("00" + i.toString(16)).slice(-2)).join("");
}
