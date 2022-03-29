import { FixedBytesCodec } from "./../../src/base";
import { Uint8 } from "@ckb-lumos/experiment-codec";
import {
  testArray,
  testOption,
  testStruct,
  testTable,
  testUnion,
  testVector,
  TestBytesCodec,
  TestMetaData,
} from "./testUtility";

export const byte: FixedBytesCodec & { testMetaData: TestMetaData } = {
  testMetaData: {
    type: "byte",
  },
  ...Uint8,
};
// array Byte2 [byte; 2];
// array Byte3 [byte; 3];
// array Byte4 [byte; 4];
// array Byte5 [byte; 5];
// array Byte6 [byte; 6];
// array Byte7 [byte; 7];
// array Byte8 [byte; 8];
// array Byte9 [byte; 9];
// array Byte10 [byte; 10];
// array Byte11 [byte; 11];
// array Byte12 [byte; 12];
// array Byte13 [byte; 13];
// array Byte14 [byte; 14];
// array Byte15 [byte; 15];
// array Byte16 [byte; 16];
export const Byte2 = testArray(byte, 2);
export const Byte3 = testArray(byte, 3);
export const Byte4 = testArray(byte, 4);
export const Byte5 = testArray(byte, 5);
export const Byte6 = testArray(byte, 6);
export const Byte7 = testArray(byte, 7);
export const Byte8 = testArray(byte, 8);
export const Byte9 = testArray(byte, 9);
export const Byte10 = testArray(byte, 10);
export const Byte11 = testArray(byte, 11);
export const Byte12 = testArray(byte, 12);
export const Byte13 = testArray(byte, 13);
export const Byte14 = testArray(byte, 14);
export const Byte15 = testArray(byte, 15);
export const Byte16 = testArray(byte, 16);

// array Word [byte; 2];
// array Word2 [Word; 2];
// array Word3 [Word; 3];
// array Word4 [Word; 4];
// array Word5 [Word; 5];
// array Word6 [Word; 6];
// array Word7 [Word; 7];
// array Word8 [Word; 8];
export const Word = testArray(byte, 2);
export const Word2 = testArray(Word, 2);
export const Word3 = testArray(Word, 3);
export const Word4 = testArray(Word, 4);
export const Word5 = testArray(Word, 5);
export const Word6 = testArray(Word, 6);
export const Word7 = testArray(Word, 7);
export const Word8 = testArray(Word, 8);

// array Byte3x3 [Byte3; 3];
// array Byte5x3 [Byte5; 3];
// array Byte7x3 [Byte7; 3];
// array Byte9x3 [Byte9; 3];
export const Byte3x3 = testArray(Byte3, 3);
export const Byte5x3 = testArray(Byte5, 3);
export const Byte7x3 = testArray(Byte7, 3);
export const Byte9x3 = testArray(Byte9, 3);

// struct StructA {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte2,
// }
export const StructA = testStruct(
  {
    f1: byte,
    f2: byte,
    f3: Byte2,
    f4: Byte2,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructB {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte3,
// }
export const StructB = testStruct(
  {
    f1: byte,
    f2: byte,
    f3: Byte2,
    f4: Byte3,
  },
  ["f1", "f2", "f3", "f4"]
);

// struct StructC {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte4,
// }
export const StructC = testStruct(
  {
    f1: byte,
    f2: byte,
    f3: Byte2,
    f4: Byte4,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructD {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte5,
// }
export const StructD = testStruct(
  {
    f1: byte,
    f2: byte,
    f3: Byte2,
    f4: Byte5,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructE {
//     f1: byte,
//     f2: Byte2,
//     f3: byte,
//     f4: Byte2,
// }
export const StructE = testStruct(
  {
    f1: byte,
    f2: Byte2,
    f3: byte,
    f4: Byte2,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructF {
//     f1: byte,
//     f2: Byte3,
//     f3: byte,
// }
export const StructF = testStruct(
  {
    f1: byte,
    f2: Byte3,
    f3: byte,
  },
  ["f1", "f2", "f3"]
);
// struct StructG {
//     f1: Byte3,
//     f2: byte,
//     f3: Byte2,
//     f4: Word2,
// }
export const StructG = testStruct(
  {
    f1: Byte3,
    f2: byte,
    f3: Byte2,
    f4: Word2,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructH {
//     f1: Byte3,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte4,
// }
export const StructH = testStruct(
  {
    f1: Byte3,
    f2: byte,
    f3: Byte2,
    f4: Byte4,
  },
  ["f1", "f2", "f3", "f4"]
);
// struct StructI {
//     f1: Byte3,
//     f2: byte,
// }
export const StructI = testStruct(
  {
    f1: Byte3,
    f2: byte,
  },
  ["f1", "f2"]
);
// struct StructJ {
//     f1: Byte6,
//     f2: byte,
// }
export const StructJ = testStruct(
  {
    f1: Byte6,
    f2: byte,
  },
  ["f1", "f2"]
);

// array StructIx3 [StructI; 3];
export const StructIx3 = testArray(StructI, 3);

// struct StructO {
//     f1: StructIx3,
//     f2: byte,
// }
export const StructO = testStruct(
  {
    f1: StructIx3,
    f2: byte,
  },
  ["f1", "f2"]
);
// struct StructP {
//     f1: StructJ,
//     f2: byte,
// }
export const StructP = testStruct(
  {
    f1: StructJ,
    f2: byte,
  },
  ["f1", "f2"]
);

// vector Bytes <byte>;
export const Bytes = testVector(byte);
// vector Words <Word>;
export const Words = testVector(Word);

// vector Byte3Vec <Byte3>;
export const Byte3Vec = testVector(Byte3);
// vector Byte7Vec <Byte7>;
export const Byte7Vec = testVector(Byte7);
// vector StructIVec <StructI>;
export const StructIVec = testVector(StructI);
// vector StructJVec <StructJ>;
export const StructJVec = testVector(StructJ);
// vector StructPVec <StructP>;
export const StructPVec = testVector(StructP);

// vector BytesVec <Bytes>;
export const BytesVec = testVector(Bytes);
// vector WordsVec <Words>;
export const WordsVec = testVector(Words);

// table Table0 {
// }
export const Table0 = testTable({}, [] as never[]);

// table Table1 {
//     f1: byte,
// }
export const Table1 = testTable(
  {
    f1: byte,
  },
  ["f1"]
);
// table Table2 {
//     f1: byte,
//     f2: Word2,
// }
export const Table2 = testTable(
  {
    f1: byte,
    f2: Word2,
  },
  ["f1", "f2"]
);
// table Table3 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
// }
export const Table3 = testTable(
  {
    f1: byte,
    f2: Word2,
    f3: StructA,
  },
  ["f1", "f2", "f3"]
);
// table Table4 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
// }
export const Table4 = testTable(
  {
    f1: byte,
    f2: Word2,
    f3: StructA,
    f4: Bytes,
  },
  ["f1", "f2", "f3", "f4"]
);
// table Table5 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
//     f5: BytesVec,
// }
export const Table5 = testTable(
  {
    f1: byte,
    f2: Word2,
    f3: StructA,
    f4: Bytes,
    f5: BytesVec,
  },
  ["f1", "f2", "f3", "f4", "f5"]
);
// table Table6 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
//     f5: BytesVec,
//     f6: Table5,
// }
export const Table6 = testTable(
  {
    f1: byte,
    f2: Word2,
    f3: StructA,
    f4: Bytes,
    f5: BytesVec,
    f6: Table5,
  },
  ["f1", "f2", "f3", "f4", "f5", "f6"]
);

// option ByteOpt (byte);
// option WordOpt (Word);
// option StructAOpt (StructA);
// option StructPOpt (StructP);
// option BytesOpt (Bytes);
// option WordsOpt (Words);
// option BytesVecOpt (BytesVec);
// option WordsVecOpt (WordsVec);
// option Table0Opt (Table0);
// option Table6Opt (Table6);
// option Table6OptOpt (Table6Opt);
export const ByteOpt = testOption(byte);
export const WordOpt = testOption(Word);
export const StructAOpt = testOption(StructA);
export const StructPOpt = testOption(StructP);
export const BytesOpt = testOption(Bytes);
export const WordsOpt = testOption(Words);
export const BytesVecOpt = testOption(BytesVec);
export const WordsVecOpt = testOption(WordsVec);
export const Table0Opt = testOption(Table0);
export const Table6Opt = testOption(Table6);
export const Table6OptOpt = testOption(Table6Opt);

// vector ByteOptVec <ByteOpt>;
// vector WordOptVec <WordOpt>;
// vector WordsOptVec <WordsOpt>;
// vector BytesOptVec <BytesOpt>;
export const ByteOptVec = testVector(ByteOpt);
export const WordOptVec = testVector(WordOpt);
export const WordsOptVec = testVector(WordsOpt);
export const BytesOptVec = testVector(BytesOpt);

// union UnionA {
//     byte,
//     Word,
//     StructA,
//     Bytes,
//     Words,
//     Table0,
//     Table6,
//     Table6Opt,
// }
export const UnionA = testUnion(
  {
    byte,
    Word,
    StructA,
    Bytes,
    Words,
    Table0,
    Table6,
    Table6Opt,
  },
  ["byte", "Word", "StructA", "Bytes", "Words", "Table0", "Table6", "Table6Opt"]
);
// table TableA {
//     f1: Word2,
//     f2: StructA,
//     f3: Bytes,
//     f4: BytesVec,
//     f5: Table1,
//     f6: BytesOpt,
//     f7: UnionA,
//     f8: byte,
// }
export const TableA = testTable(
  {
    f1: Word2,
    f2: StructA,
    f3: Bytes,
    f4: BytesVec,
    f5: Table1,
    f6: BytesOpt,
    f7: UnionA,
    f8: byte,
  },
  ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"]
);
// table AllInOne {
//     f0: byte,
//     f1: Byte2,
//     f2: Byte3,
//     f3: Byte4,
//     f4: Byte5,
//     f5: Byte6,
//     f6: Byte7,
//     f7: Byte8,
//     f8: Byte9,
//     f9: Byte10,
//     f10: Byte11,
//     f11: Byte12,
//     f12: Byte13,
//     f13: Byte14,
//     f14: Byte15,
//     f15: Byte16,
//     f16: Word,
//     f17: Word2,
//     f18: Word3,
//     f19: Word4,
//     f20: Word5,
//     f21: Word6,
//     f22: Word7,
//     f23: Word8,
//     f24: Byte3x3,
//     f25: Byte5x3,
//     f26: Byte7x3,
//     f27: Byte9x3,
//     f28: StructA,
//     f29: StructB,
//     f30: StructC,
//     f31: StructD,
//     f32: StructE,
//     f33: StructF,
//     f34: StructG,
//     f35: StructH,
//     f36: StructI,
//     f37: StructJ,
//     f38: StructIx3,
//     f39: StructO,
//     f40: StructP,
//     f41: Bytes,
//     f42: Words,
//     f43: Byte3Vec,
//     f44: Byte7Vec,
//     f45: StructIVec,
//     f46: StructJVec,
//     f47: StructPVec,
//     f48: BytesVec,
//     f49: WordsVec,
//     f50: Table0,
//     f51: Table1,
//     f52: Table2,
//     f53: Table3,
//     f54: Table4,
//     f55: Table5,
//     f56: Table6,
//     f57: ByteOpt,
//     f58: WordOpt,
//     f59: StructAOpt,
//     f60: StructPOpt,
//     f61: BytesOpt,
//     f62: WordsOpt,
//     f63: BytesVecOpt,
//     f64: WordsVecOpt,
//     f65: Table0Opt,
//     f66: Table6Opt,
//     f67: Table6OptOpt,
//     f68: ByteOptVec,
//     f69: WordOptVec,
//     f70: WordsOptVec,
//     f71: BytesOptVec,
//     f72: UnionA,
//     f73: TableA,
// }
export const AllInOne = testTable(
  {
    f0: byte,
    f1: Byte2,
    f2: Byte3,
    f3: Byte4,
    f4: Byte5,
    f5: Byte6,
    f6: Byte7,
    f7: Byte8,
    f8: Byte9,
    f9: Byte10,
    f10: Byte11,
    f11: Byte12,
    f12: Byte13,
    f13: Byte14,
    f14: Byte15,
    f15: Byte16,
    f16: Word,
    f17: Word2,
    f18: Word3,
    f19: Word4,
    f20: Word5,
    f21: Word6,
    f22: Word7,
    f23: Word8,
    f24: Byte3x3,
    f25: Byte5x3,
    f26: Byte7x3,
    f27: Byte9x3,
    f28: StructA,
    f29: StructB,
    f30: StructC,
    f31: StructD,
    f32: StructE,
    f33: StructF,
    f34: StructG,
    f35: StructH,
    f36: StructI,
    f37: StructJ,
    f38: StructIx3,
    f39: StructO,
    f40: StructP,
    f41: Bytes,
    f42: Words,
    f43: Byte3Vec,
    f44: Byte7Vec,
    f45: StructIVec,
    f46: StructJVec,
    f47: StructPVec,
    f48: BytesVec,
    f49: WordsVec,
    f50: Table0,
    f51: Table1,
    f52: Table2,
    f53: Table3,
    f54: Table4,
    f55: Table5,
    f56: Table6,
    f57: ByteOpt,
    f58: WordOpt,
    f59: StructAOpt,
    f60: StructPOpt,
    f61: BytesOpt,
    f62: WordsOpt,
    f63: BytesVecOpt,
    f64: WordsVecOpt,
    f65: Table0Opt,
    f66: Table6Opt,
    f67: Table6OptOpt,
    f68: ByteOptVec,
    f69: WordOptVec,
    f70: WordsOptVec,
    f71: BytesOptVec,
    f72: UnionA,
    f73: TableA,
  },
  [
    "f0",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12",
    "f13",
    "f14",
    "f15",
    "f16",
    "f17",
    "f18",
    "f19",
    "f20",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "f28",
    "f29",
    "f30",
    "f31",
    "f32",
    "f33",
    "f34",
    "f35",
    "f36",
    "f37",
    "f38",
    "f39",
    "f40",
    "f41",
    "f42",
    "f43",
    "f44",
    "f45",
    "f46",
    "f47",
    "f48",
    "f49",
    "f50",
    "f51",
    "f52",
    "f53",
    "f54",
    "f55",
    "f56",
    "f57",
    "f58",
    "f59",
    "f60",
    "f61",
    "f62",
    "f63",
    "f64",
    "f65",
    "f66",
    "f67",
    "f68",
    "f69",
    "f70",
    "f71",
    "f72",
    "f73",
  ]
);

export const codecs: Record<string, TestBytesCodec> = {
  byte,
  Byte2,
  Byte3,
  Byte4,
  Byte5,
  Byte6,
  Byte7,
  Byte8,
  Byte9,
  Byte10,
  Byte11,
  Byte12,
  Byte13,
  Byte14,
  Byte15,
  Byte16,
  Word,
  Word2,
  Word3,
  Word4,
  Word5,
  Word6,
  Word7,
  Word8,
  Byte3x3,
  Byte5x3,
  Byte7x3,
  Byte9x3,
  StructA,
  StructB,
  StructC,
  StructD,
  StructE,
  StructF,
  StructG,
  StructH,
  StructI,
  StructJ,
  StructIx3,
  StructO,
  StructP,
  Bytes,
  Words,
  Byte3Vec,
  Byte7Vec,
  StructIVec,
  StructJVec,
  StructPVec,
  BytesVec,
  WordsVec,
  Table0,
  Table1,
  Table2,
  Table3,
  Table4,
  Table5,
  Table6,
  ByteOpt,
  WordOpt,
  StructAOpt,
  StructPOpt,
  BytesOpt,
  WordsOpt,
  BytesVecOpt,
  WordsVecOpt,
  Table0Opt,
  Table6Opt,
  Table6OptOpt,
  ByteOptVec,
  WordOptVec,
  WordsOptVec,
  BytesOptVec,
  UnionA,
  TableA,
  AllInOne,
};
