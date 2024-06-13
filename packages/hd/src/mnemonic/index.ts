/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  sha256,
  sha512,
  pbkdf2,
  pbkdf2Async,
  randomBytes,
} from "@ckb-lumos/crypto";
import { bytes } from "@ckb-lumos/codec";
import { HexString } from "@ckb-lumos/base";
import wordList from "./word_list";

const { bytify, hexify } = bytes;

const RADIX = 2048;
const PBKDF2_ROUNDS = 2048;
const KEY_LEN = 64;
const MIN_ENTROPY_SIZE = 16;
const MAX_ENTROPY_SIZE = 32;
const MIN_WORDS_SIZE = 12;
const MAX_WORDS_SIZE = 24;

const INVALID_MNEMONIC = `Invalid mnemonic`;
const INVALID_CHECKSUM = `Invalid checksum`;
const ENTROPY_NOT_DIVISIBLE = `Entropy should be divisable by 4`;
const ENTROPY_TOO_LONG = `Entropy should be shorter than ${
  MAX_ENTROPY_SIZE + 1
}`;
const ENTROPY_TOO_SHORT = `Entropy should be longer than ${
  MIN_ENTROPY_SIZE - 1
}`;
const WORDS_TOO_LONG = `Words should be shorter than ${MAX_WORDS_SIZE + 1}`;
const WORDS_TOO_SHORT = `Words should be longer than ${MIN_WORDS_SIZE - 1}`;

if (wordList.length !== RADIX) {
  throw new Error(
    `Word list should have ${RADIX} words, but ${wordList.length} received in fact`
  );
}

function bytesToBinary(bytes: Uint8Array): string {
  return bytes.reduce((binary, byte) => {
    return binary + byte.toString(2).padStart(8, "0");
  }, "");
}

function deriveChecksumBits(entropyBuffer: Uint8Array): string {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;
  const hash = sha256(entropyBuffer);
  return bytesToBinary(hash).slice(0, CS);
}

function salt(password = ""): string {
  return `mnemonic${password}`;
}

export function mnemonicToSeedSync(mnemonic = "", password = ""): Uint8Array {
  const mnemonicBuffer = new TextEncoder().encode(mnemonic.normalize("NFKD"));
  const saltBuffer = new TextEncoder().encode(salt(password.normalize("NFKD")));
  return pbkdf2(sha512, mnemonicBuffer, saltBuffer, {
    c: PBKDF2_ROUNDS,
    dkLen: KEY_LEN,
  });
}

export function mnemonicToSeed(
  mnemonic = "",
  password = ""
): Promise<Uint8Array> {
  const mnemonicBuffer = new TextEncoder().encode(mnemonic.normalize("NFKD"));
  const saltBuffer = new TextEncoder().encode(salt(password.normalize("NFKD")));
  return pbkdf2Async(sha512, mnemonicBuffer, saltBuffer, {
    c: PBKDF2_ROUNDS,
    dkLen: KEY_LEN,
  });
}

export function mnemonicToEntropy(mnemonic = ""): HexString {
  const words = mnemonic.normalize("NFKD").split(" ");
  if (words.length < MIN_WORDS_SIZE) {
    throw new Error(WORDS_TOO_SHORT);
  }
  if (words.length > MAX_WORDS_SIZE) {
    throw new Error(WORDS_TOO_LONG);
  }
  if (words.length % 3 !== 0) {
    throw new Error(INVALID_MNEMONIC);
  }
  const bits = words
    .map((word) => {
      const index = wordList!.indexOf(word);
      if (index === -1) {
        throw new Error(INVALID_MNEMONIC);
      }
      return index.toString(2).padStart(11, "0");
    })
    .join("");

  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  const entropyBytes = entropyBits
    .match(/(.{1,8})/g)!
    .map((byte) => parseInt(byte, 2));
  if (entropyBytes.length < MIN_ENTROPY_SIZE) {
    throw new Error(ENTROPY_TOO_SHORT);
  }
  if (entropyBytes.length > MAX_ENTROPY_SIZE) {
    throw new Error(ENTROPY_TOO_LONG);
  }
  if (entropyBytes.length % 4 !== 0) {
    throw new Error(ENTROPY_NOT_DIVISIBLE);
  }

  const entropy = Uint8Array.from(entropyBytes);
  const newChecksum = deriveChecksumBits(entropy);
  if (newChecksum !== checksumBits) {
    throw new Error(INVALID_CHECKSUM);
  }

  return hexify(entropy);
}

export function entropyToMnemonic(entropyStr: HexString): string {
  const entropy = bytify(entropyStr);

  if (entropy.length < MIN_ENTROPY_SIZE) {
    throw new TypeError(ENTROPY_TOO_SHORT);
  }
  if (entropy.length > MAX_ENTROPY_SIZE) {
    throw new TypeError(ENTROPY_TOO_LONG);
  }
  if (entropy.length % 4 !== 0) {
    throw new TypeError(ENTROPY_NOT_DIVISIBLE);
  }

  const entropyBytes = bytesToBinary(entropy);
  const checksumBytes = deriveChecksumBits(entropy);

  const bytes = entropyBytes + checksumBytes;
  const chunks = bytes.match(/(.{1,11})/g)!;
  const words = chunks.map((binary) => {
    const index = parseInt(binary, 2);
    return wordList[index];
  });

  return words.join(" ");
}

export function validateMnemonic(mnemonic: string): boolean {
  try {
    mnemonicToEntropy(mnemonic);
  } catch (e) {
    return false;
  }
  return true;
}

// Generate 12 words mnemonic code
export function generateMnemonic(): string {
  const entropySize = 16;
  const entropy = hexify(randomBytes(entropySize));
  return entropyToMnemonic(entropy);
}

export default {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
  generateMnemonic,
};
