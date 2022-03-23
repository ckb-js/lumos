export const Uint8 = 0;
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
export const Byte2 = new Array(2).fill(Uint8);
export const Byte3 = new Array(3).fill(Uint8);
export const Byte4 = new Array(4).fill(Uint8);
export const Byte5 = new Array(5).fill(Uint8);
export const Byte6 = new Array(6).fill(Uint8);
export const Byte7 = new Array(7).fill(Uint8);
export const Byte8 = new Array(8).fill(Uint8);
export const Byte9 = new Array(9).fill(Uint8);
export const Byte10 = new Array(10).fill(Uint8);
export const Byte11 = new Array(11).fill(Uint8);
export const Byte12 = new Array(12).fill(Uint8);
export const Byte13 = new Array(13).fill(Uint8);
export const Byte14 = new Array(14).fill(Uint8);
export const Byte15 = new Array(15).fill(Uint8);
export const Byte16 = new Array(16).fill(Uint8);

// array Word [byte; 2];
// array Word2 [Word; 2];
// array Word3 [Word; 3];
// array Word4 [Word; 4];
// array Word5 [Word; 5];
// array Word6 [Word; 6];
// array Word7 [Word; 7];
// array Word8 [Word; 8];
export const Word = new Array(2).fill(0);
export const Word2 = new Array(2).fill(Word);
export const Word3 = new Array(3).fill(Word);
export const Word4 = new Array(4).fill(Word);
export const Word5 = new Array(5).fill(Word);
export const Word6 = new Array(6).fill(Word);
export const Word7 = new Array(7).fill(Word);
export const Word8 = new Array(8).fill(Word);

// array Byte3x3 [Byte3; 3];
// array Byte5x3 [Byte5; 3];
// array Byte7x3 [Byte7; 3];
// array Byte9x3 [Byte9; 3];
export const Byte3x3 = new Array(3).fill(Byte3);
export const Byte5x3 = new Array(3).fill(Byte5);
export const Byte7x3 = new Array(3).fill(Byte7);
export const Byte9x3 = new Array(3).fill(Byte9);

// struct StructA {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte2,
// }
export const StructA = {
  f1: Uint8,
  f2: Uint8,
  f3: Byte2,
  f4: Byte2,
};
// struct StructB {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte3,
// }
export const StructB = {
  f1: Uint8,
  f2: Uint8,
  f3: Byte2,
  f4: Byte3,
};
// struct StructC {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte4,
// }
export const StructC = {
  f1: Uint8,
  f2: Uint8,
  f3: Byte2,
  f4: Byte4,
};
// struct StructD {
//     f1: byte,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte5,
// }
export const StructD = {
  f1: Uint8,
  f2: Uint8,
  f3: Byte2,
  f4: Byte5,
};
// struct StructE {
//     f1: byte,
//     f2: Byte2,
//     f3: byte,
//     f4: Byte2,
// }
export const StructE = {
  f1: Uint8,
  f2: Byte2,
  f3: Uint8,
  f4: Byte2,
};
// struct StructF {
//     f1: byte,
//     f2: Byte3,
//     f3: byte,
// }
export const StructF = {
  f1: Uint8,
  f2: Byte3,
  f3: Uint8,
};
// struct StructG {
//     f1: Byte3,
//     f2: byte,
//     f3: Byte2,
//     f4: Word2,
// }
export const StructG = {
  f1: Byte3,
  f2: Uint8,
  f3: Byte2,
  f4: Word2,
};
// struct StructH {
//     f1: Byte3,
//     f2: byte,
//     f3: Byte2,
//     f4: Byte4,
// }
export const StructH = {
  f1: Byte3,
  f2: Uint8,
  f3: Byte2,
  f4: Byte4,
};
// struct StructI {
//     f1: Byte3,
//     f2: byte,
// }
export const StructI = {
  f1: Byte3,
  f2: Uint8,
};
// struct StructJ {
//     f1: Byte6,
//     f2: byte,
// }
export const StructJ = {
  f1: Byte6,
  f2: Uint8,
};
// array StructIx3 [StructI; 3];
export const StructIx3 = new Array(3).fill(StructI);

// struct StructO {
//     f1: StructIx3,
//     f2: byte,
// }
export const StructO = {
  f1: StructIx3,
  f2: Uint8,
};
// struct StructP {
//     f1: StructJ,
//     f2: byte,
// }
export const StructP = {
  f1: StructJ,
  f2: Uint8,
};

// vector Bytes <byte>;
export const Bytes = [];
// vector Words <Word>;
export const Words = [];

// vector Byte3Vec <Byte3>;
export const Byte3Vec = [];
// vector Byte7Vec <Byte7>;
export const Byte7Vec = [];
// vector StructIVec <StructI>;
export const StructIVec = [];
// vector StructJVec <StructJ>;
export const StructJVec = [];
// vector StructPVec <StructP>;
export const StructPVec = [];

// vector BytesVec <Bytes>;
export const BytesVec = [];
// vector WordsVec <Words>;
export const WordsVec = [];

// table Table0 {
// }
export const Table0 = {};

// table Table1 {
//     f1: byte,
// }
export const Table1 = {
  f1: Uint8,
};
// table Table2 {
//     f1: byte,
//     f2: Word2,
// }
export const Table2 = {
  f1: Uint8,
  f2: Word2,
};
// table Table3 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
// }
export const Table3 = {
  f1: Uint8,
  f2: Word2,
  f3: StructA,
};
// table Table4 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
// }
export const Table4 = {
  f1: Uint8,
  f2: Word2,
  f3: StructA,
  f4: Bytes,
};
// table Table5 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
//     f5: BytesVec,
// }
export const Table5 = {
  f1: Uint8,
  f2: Word2,
  f3: StructA,
  f4: Bytes,
  f5: BytesVec,
};
// table Table6 {
//     f1: byte,
//     f2: Word2,
//     f3: StructA,
//     f4: Bytes,
//     f5: BytesVec,
//     f6: Table5,
// }
export const Table6 = {
  f1: Uint8,
  f2: Word2,
  f3: StructA,
  f4: Bytes,
  f5: BytesVec,
  f6: Table5,
};

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
export const ByteOpt = undefined;
export const WordOpt = undefined;
export const StructAOpt = undefined;
export const StructPOpt = undefined;
export const BytesOpt = undefined;
export const WordsOpt = undefined;
export const BytesVecOpt = undefined;
export const WordsVecOpt = undefined;
export const Table0Opt = undefined;
export const Table6Opt = undefined;
export const Table6OptOpt = undefined;

// vector ByteOptVec <ByteOpt>;
// vector WordOptVec <WordOpt>;
// vector WordsOptVec <WordsOpt>;
// vector BytesOptVec <BytesOpt>;
export const ByteOptVec = [];
export const WordOptVec = [];
export const WordsOptVec = [];
export const BytesOptVec = [];

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
export const UnionA = {
  type: Uint8,
  value: Uint8,
};
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
export const TableA = {
  f1: Word2,
  f2: StructA,
  f3: Bytes,
  f4: BytesVec,
  f5: Table1,
  f6: BytesOpt,
  f7: UnionA,
  f8: Uint8,
};
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
export const AllInOne = {
  f0: Uint8,
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
};
