import { molecule, bytes } from "../src";

const UTF8String = molecule.byteVecOf<string>({
  pack: (str) => new TextEncoder().encode(str),
  unpack: (buf) => new TextDecoder().decode(bytes.bytify(buf)),
});

const packed = UTF8String.pack("hello world, 你好世界");
const unpacked = UTF8String.unpack(packed);

console.log("packed: ", packed);
console.log("unpacked: ", unpacked);
