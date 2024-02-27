import { Script } from "./blockchain";

const packed = Script.pack({ codeHash: new Uint8Array(32), hashType: "type", args: "0xdeadbeef" });
const unpacked = Script.unpack(packed);

console.log("packed script", packed);
console.log("unpacked script", unpacked);
