// This example shows how to create a codec for UTF-8 strings.

import { createBytesCodec } from "@ckb-lumos/lumos/codec";

const stringCodec = createBytesCodec<string>({
  pack: (str) => new TextEncoder().encode(str),
  unpack: (bytes) => new TextDecoder().decode(bytes),
});

const encoded = stringCodec.pack("hello world");
const decoded = stringCodec.unpack(encoded);

console.log("encoded:", encoded);
console.log("decoded:", decoded);
