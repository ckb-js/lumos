import { molecule } from "../src";
import { Buffer } from "buffer"; // https://github.com/feross/buffer

const UTF8String = molecule.byteVecOf<string>({
  pack: (str) => Buffer.from(str, "utf8"),
  unpack: (buf) => Buffer.from(buf).toString("utf8"),
});

const packed = UTF8String.pack("hello world, 你好世界");
const unpacked = UTF8String.unpack(packed);

console.log("packed: ", packed);
console.log("unpacked: ", unpacked);
