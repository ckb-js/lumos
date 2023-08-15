import { Block, utils } from "@ckb-lumos/base";
import { ScriptConfig } from "./types";

// https://github.com/nervosnetwork/ckb-sdk-rust/blob/94ce4379454cdaf046f64b346e18e73e029f0ae6/src/constants.rs#L19C1-L24C62
// the index of a transaction in a block
type TransactionIndex = number;
// the index of an output in a transaction
type OutputIndex = number;
export const SIGHASH_OUTPUT_LOC: [TransactionIndex, OutputIndex] = [0, 1];
export const MULTISIG_OUTPUT_LOC: [TransactionIndex, OutputIndex] = [0, 4];
export const DAO_OUTPUT_LOC: [TransactionIndex, OutputIndex] = [0, 2];
export const SIGHASH_GROUP_OUTPUT_LOC: [TransactionIndex, OutputIndex] = [1, 0];
// prettier-ignore
export const MULTISIG_GROUP_OUTPUT_LOC: [TransactionIndex, OutputIndex] = [1, 1];

/**
 * Generate {@link ScriptConfig} for the genesis block,
 * use this function when you are on a testnet,
 * or you cannot determine which network you are on
 * @example
 *   const rpc = new RPC('http://localhost:8114')
 *   const genesisBlock = await rpc.getBlockByNumber('0x0')
 *   const scriptConfig = generateGenesisScriptConfigs(genesisBlock)
 * @param genesisBlock
 */
export function generateGenesisScriptConfigs(
  genesisBlock: Block
): Record<
  "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "DAO",
  ScriptConfig
> {
  if (!genesisBlock) throw new Error("cannot load genesis block");

  return {
    SECP256K1_BLAKE160: {
      CODE_HASH: utils.computeScriptHash(
        genesisBlock.transactions[SIGHASH_OUTPUT_LOC[0]].outputs[
          SIGHASH_OUTPUT_LOC[1]
        ].type!
      ),
      INDEX: toHexNumber(SIGHASH_GROUP_OUTPUT_LOC[1]),
      DEP_TYPE: "depGroup",
      HASH_TYPE: "type",
      TX_HASH: genesisBlock.transactions[SIGHASH_GROUP_OUTPUT_LOC[0]].hash!,
      SHORT_ID: 0,
    },
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH: utils.computeScriptHash(
        genesisBlock.transactions[MULTISIG_OUTPUT_LOC[0]].outputs[
          MULTISIG_OUTPUT_LOC[1]
        ].type!
      ),
      INDEX: toHexNumber(MULTISIG_GROUP_OUTPUT_LOC[1]),
      DEP_TYPE: "depGroup",
      HASH_TYPE: "type",
      TX_HASH: genesisBlock.transactions[MULTISIG_GROUP_OUTPUT_LOC[0]].hash!,
      SHORT_ID: 1,
    },
    DAO: {
      CODE_HASH: utils.computeScriptHash(
        genesisBlock.transactions[DAO_OUTPUT_LOC[0]].outputs[DAO_OUTPUT_LOC[1]]
          .type!
      ),
      INDEX: toHexNumber(DAO_OUTPUT_LOC[1]),
      DEP_TYPE: "code",
      HASH_TYPE: "type",
      TX_HASH: genesisBlock.transactions[DAO_OUTPUT_LOC[0]].hash!,
    },
  };
}

function toHexNumber(number: number): string {
  return `0x${number.toString(16)}`;
}
