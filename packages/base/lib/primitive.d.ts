/**
 * HexString represents string starts with "0x" and followed by even number(including empty) of [0-9a-fA-F] characters.
 */
 export type HexString = string;
 /**
  * Hexadecimal represents string starts with "0x" and followed by any number(excluding empty) of [0-9a-fA-F] characters.
  */
 export type Hexadecimal = string;
 export type Hash = HexString;
 export type HexNumber = Hexadecimal;
 export type PackedSince = string;
 export type PackedDao = string;
 
 export type Address = string;
 
 export type HexadecimalRange = [Hexadecimal, Hexadecimal];
 