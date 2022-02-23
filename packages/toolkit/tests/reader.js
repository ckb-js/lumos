const test = require("ava");
const { Reader } = require("../lib");

test("reader functions", (t) => {
  const ra = Reader.from("0x12345678");
  const rb = Reader.from(Uint8Array.from([0x12, 0x34, 0x56, 0x78]));
  const rc = Reader.from(Buffer.from("12345678", "hex"));
  const rd = Reader.from(Uint8Array.from([0x12, 0x34, 0x56, 0x78]).buffer);

  t.is(new DataView(ra.toArrayBuffer()).getUint32(0), 0x12345678);
  t.is(new DataView(rb.toArrayBuffer()).getUint32(0), 0x12345678);
  t.is(new DataView(rc.toArrayBuffer()).getUint32(0), 0x12345678);
  t.is(new DataView(rd.toArrayBuffer()).getUint32(0), 0x12345678);

  t.true(Reader.isReader(ra));
  t.true(Reader.isReader(rb));
  t.true(Reader.isReader(rc));
  t.true(Reader.isReader(rd));
});
