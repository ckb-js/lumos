import { byteVecOf } from "@ckb-lumos/experiment-molecule";
import { Buffer } from "buffer"; // https://github.com/feross/buffer

const UTF8String = byteVecOf<string>({
  pack: (str) => {
    return Uint8Array.from(Buffer.from(str, "utf8")).buffer;
  },
  unpack: (buf) => {
    return Buffer.from(buf).toString("utf8");
  },
});

const packed = UTF8String.pack("hello world, 你好世界");
const unpacked = UTF8String.unpack(packed);

console.log("packed: ", packed);
console.log("unpacked: ", unpacked);
