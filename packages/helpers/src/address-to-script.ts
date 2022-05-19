// https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0021-ckb-address-format/0021-ckb-address-format.md
// | format type |                   description                                |
// |:-----------:|--------------------------------------------------------------|
// |  0x00       | full version identifies the hash_type                        |
// |  0x01       | short version for locks with popular code_hash, deprecated   |
// |  0x02       | full version with hash_type = "Data", deprecated             |
// |  0x04       | full version with hash_type = "Type", deprecated             |

import { Address, Script } from "@ckb-lumos/base";
import { getConfig } from "@ckb-lumos/config-manager";
import { bech32, bech32m } from "bech32";
import { Options } from "./";
import { byteArrayToHex } from "./utils";

const BECH32_LIMIT = 1023;

/**
 * full version identifies the hash_type
 */
export const ADDRESS_FORMAT_FULL = 0x00;
/**
 * @deprecated
 * short version for locks with popular code_hash, deprecated
 */
export const ADDRESS_FORMAT_SHORT = 0x01;

/**
 * @deprecated
 * full version with hash_type = "Data", deprecated
 */
export const ADDRESS_FORMAT_FULLDATA = 0x02;

/**
 * @deprecated
 * full version with hash_type = "Type", deprecated
 */
export const ADDRESS_FORMAT_FULLTYPE = 0x04;

export function parseFullFormatAddress(
  address: Address,
  { config }: Options
): Script {
  config = config || getConfig();

  // throw error here if polymod not 0x2bc830a3(BECH32M_CONST)
  // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#bech32m
  const { words, prefix } = bech32m.decode(address, BECH32_LIMIT);

  if (prefix !== config.PREFIX) {
    throw Error(
      `Invalid prefix! Expected: ${config.PREFIX}, actual: ${prefix}`
    );
  }

  const [formatType, ...body] = bech32m.fromWords(words);

  if (formatType !== ADDRESS_FORMAT_FULL) {
    throw new Error("Invalid address format type");
  }

  if (body.length < 32 + 1) {
    throw new Error("Invalid payload length, too short!");
  }

  const code_hash = byteArrayToHex(body.slice(0, 32));
  const hash_type = (() => {
    const serializedHashType = body[32];

    if (serializedHashType === 0) return "data";
    if (serializedHashType === 1) return "type";
    if (serializedHashType === 2) return "data1";

    throw new Error(`unknown hash_type ${serializedHashType}`);
  })();
  const args = byteArrayToHex(body.slice(33));

  return { code_hash, hash_type, args };
}

export function parseDeprecatedCkb2019Address(
  address: string,
  { config }: Options
): Script {
  config = config || getConfig();

  // throw error here if polymod not 1
  // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#bech32m
  const { prefix, words } = bech32.decode(address, BECH32_LIMIT);

  if (prefix !== config.PREFIX) {
    throw Error(
      `Invalid prefix! Expected: ${config.PREFIX}, actual: ${prefix}`
    );
  }
  const [formatType, ...body] = bech32.fromWords(words);

  switch (formatType) {
    // payload = 0x01 | code_hash_index | args
    case ADDRESS_FORMAT_SHORT: {
      const [shortId, ...argsBytes] = body;

      /* secp256k1 / multisig / ACP */
      if (argsBytes.length !== 20) {
        throw Error(`Invalid payload length!`);
      }
      const scriptTemplate = Object.values(config.SCRIPTS).find(
        (s) => s && s.SHORT_ID === shortId
      );
      if (!scriptTemplate) {
        throw Error(`Invalid code hash index: ${shortId}!`);
      }
      return {
        code_hash: scriptTemplate.CODE_HASH,
        hash_type: scriptTemplate.HASH_TYPE,
        args: byteArrayToHex(argsBytes),
      };
    }
    // payload = 0x02 | code_hash | args
    case ADDRESS_FORMAT_FULLDATA: {
      if (body.length < 32) {
        throw Error(`Invalid payload length!`);
      }
      return {
        code_hash: byteArrayToHex(body.slice(0, 32)),
        hash_type: "data",
        args: byteArrayToHex(body.slice(32)),
      };
    }
    // payload = 0x04 | code_hash | args
    case ADDRESS_FORMAT_FULLTYPE: {
      if (body.length < 32) {
        throw Error(`Invalid payload length!`);
      }
      return {
        code_hash: byteArrayToHex(body.slice(0, 32)),
        hash_type: "type",
        args: byteArrayToHex(body.slice(32)),
      };
    }
  }
  throw Error(`Invalid payload format type: ${formatType}`);
}
