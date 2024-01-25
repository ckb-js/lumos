import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { bytes, BytesLike } from "@ckb-lumos/codec";
import {
  values,
  Cell,
  WitnessArgs,
  CellCollector as CellCollectorType,
  Script,
  CellProvider,
  QueryOptions,
  OutPoint,
  HexString,
  PackedSince,
  blockchain,
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import {
  addCellDep,
  prepareSigningEntries as _prepareSigningEntries,
  isOmnilockScript,
  OMNILOCK_SIGNATURE_PLACEHOLDER,
} from "./helper";
import { FromInfo } from ".";
import { parseFromInfo } from "./from_info";
import { CellCollectorConstructor } from "./type";
import {
  byteOf,
  byteVecOf,
  option,
  table,
  vector,
} from "@ckb-lumos/codec/lib/molecule";
import {
  BytesOpt,
  createFixedHexBytesCodec,
} from "@ckb-lumos/codec/lib/blockchain";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import * as bitcoin from "./omnilock-bitcoin";
import * as tron from "./omnilock-tron";

const { ScriptValue } = values;

export type OmnilockInfo = {
  auth: OmnilockAuth;
};

export type OmnilockAuth =
  | IdentityCkb
  | IdentityEthereum
  | IdentityBitcoin
  | IdentityEthereum_DISPLAY
  | IdentityEos
  | IdentityTron
  | IdentityDogecoin;

export type IdentityCkb = {
  flag: "SECP256K1_BLAKE160";
  /**
   * the blake160 hash of a secp256k1 public key
   */
  content: BytesLike;
};
export type IdentityEthereum = {
  flag: "ETHEREUM";

  /**
   * an Ethereum address, aka the public key hash, which authid = 1
   */
  content: BytesLike;
};

export type IdentityEos = {
  flag: "EOS";
  /**
   * an Eos address, aka the public key hash, which authid = 2
   */
  content: BytesLike;
};
export type IdentityTron = {
  flag: "TRON";
  /**
   * an Tron address, aka the public key hash, which authid = 3
   */
  address: string;
};
export type IdentityDogecoin = {
  flag: "DOGECOIN";
  /**
   * a Dogecoin address which authid = 5, such as
   * `DDjoXsNFMo8iu59mkKF45ddcFoECUehovB`
   */
  address: string;
};
export type IdentityEthereum_DISPLAY = {
  flag: "ETHEREUM_DISPLAY";
  /**
   * an Ethereum address, aka the public key hash, which authid = 18
   */
  content: BytesLike;
};
export type IdentityBitcoin = {
  flag: "BITCOIN";
  /**
   * a Bitcoin address which authid = 4, such as
   * `P2PKH(17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem)`,
   * `P2SH(3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX)`,
   * `Bech32(bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4)`
   */
  address: string;
};

/**
 * only support ETHEREUM and SECP256K1_BLAKE160 mode currently
 * refer to: @link https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md omnilock
 * @param omnilockInfo
 * @param options
 * @returns
 */
export function createOmnilockScript(
  omnilockInfo: OmnilockInfo,
  options?: Options
): Script {
  const config = options?.config || getConfig();
  const omnilockConfig = config.SCRIPTS.OMNILOCK;
  if (!omnilockConfig) {
    throw new Error("OMNILOCK script config not found.");
  }

  const args = (() => {
    const flag = omnilockInfo.auth.flag;
    switch (flag) {
      case "ETHEREUM":
        return bytes.hexify(bytes.concat([1], omnilockInfo.auth.content, [0]));
      case "ETHEREUM_DISPLAY":
        return bytes.hexify(bytes.concat([18], omnilockInfo.auth.content, [0]));
      case "SECP256K1_BLAKE160":
        return bytes.hexify(bytes.concat([0], omnilockInfo.auth.content, [0]));
      case "BITCOIN":
        return bytes.hexify(
          bytes.concat([4], bitcoin.decodeAddress(omnilockInfo.auth.address), [
            0,
          ])
        );
      case "TRON":
        return bytes.hexify(bytes.concat([3], tron.decodeAddress(omnilockInfo.auth.address), [0]));
      case "DOGECOIN":
        return bytes.hexify(bytes.concat([5], tron.decodeAddress(omnilockInfo.auth.address), [0]));   //same to tron addres decode
      // case "EOS":
      //   return bytes.hexify(bytes.concat([2], "0xfc06724d74926c15809adf38659a3c1fbec943d7", [0]));   //not support todo hardcode pubkeyhash
      default:
        throw new Error(`Not supported flag: ${flag}.`);
    }
  })();

  const script: Script = {
    codeHash: omnilockConfig.CODE_HASH,
    hashType: omnilockConfig.HASH_TYPE,
    args,
  };
  return script;
}

const Hexify = { pack: bytify, unpack: hexify };
const Identity = createFixedHexBytesCodec(21);
const SmtProof = byteVecOf(Hexify);
const SmtProofEntry = table(
  {
    mask: byteOf(Hexify),
    proof: SmtProof,
  },
  ["mask", "proof"]
);
const SmtProofEntryVec = vector(SmtProofEntry);
const OmniIdentity = table(
  {
    identity: Identity,
    proofs: SmtProofEntryVec,
  },
  ["identity", "proofs"]
);
const OmniIdentityOpt = option(OmniIdentity);
export const OmnilockWitnessLock = table(
  {
    signature: BytesOpt,
    omni_identity: OmniIdentityOpt,
    preimage: BytesOpt,
  },
  ["signature", "omni_identity", "preimage"]
);

export const CellCollector: CellCollectorConstructor = class CellCollector
  implements CellCollectorType
{
  private cellCollector: CellCollectorType;
  private config: Config;
  public readonly fromScript: Script;

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config = undefined,
      queryOptions = {},
    }: Options & {
      queryOptions?: QueryOptions;
    } = {}
  ) {
    if (!cellProvider) {
      throw new Error(`Cell provider is missing!`);
    }
    config = config || getConfig();
    this.fromScript = parseFromInfo(fromInfo, { config }).fromScript;

    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    if (!isOmnilockScript(this.fromScript, this.config)) {
      return;
    }

    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
};

/**
 * Setup input cell infos, such as cell deps and witnesses.
 *
 * @param txSkeleton
 * @param inputCell
 * @param _fromInfo
 * @param options
 */
export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  _fromInfo?: FromInfo,
  {
    config = undefined,
    defaultWitness = "0x",
    since = undefined,
  }: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const fromScript = inputCell.cellOutput.lock;
  if (!isOmnilockScript(fromScript, config)) {
    throw new Error(`Not OMNILOCK input!`);
  }

  // add inputCell to txSkeleton
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(inputCell);
  });

  const output: Cell = {
    cellOutput: {
      capacity: inputCell.cellOutput.capacity,
      lock: inputCell.cellOutput.lock,
      type: inputCell.cellOutput.type,
    },
    data: inputCell.data,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  if (since) {
    txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
      return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
    });
  }

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push(defaultWitness);
  });

  const template = config.SCRIPTS.OMNILOCK;
  const secp256k1Template = config.SCRIPTS.SECP256K1_BLAKE160;
  if (!template) {
    throw new Error(`OMNILOCK script not defined in config!`);
  }
  if (!secp256k1Template) {
    throw new Error(`SECP256K1_BLAKE160 script not defined in config!`);
  }

  const omnilockOutPoint: OutPoint = {
    txHash: template.TX_HASH,
    index: template.INDEX,
  };
  const secp256k1OutPoint: OutPoint = {
    txHash: secp256k1Template.TX_HASH,
    index: secp256k1Template.INDEX,
  };

  // add cell dep
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: omnilockOutPoint,
    depType: template.DEP_TYPE,
  });
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: secp256k1OutPoint,
    depType: secp256k1Template.DEP_TYPE,
  });

  // add witness
  /*
   * Modify the skeleton, so the first witness of the fromAddress script group
   * has a WitnessArgs construct with 85-byte zero filled values. While this
   * is not required, it helps in transaction fee estimation.
   */
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 85-byte zeros in hex */
      lock: OMNILOCK_SIGNATURE_PLACEHOLDER,
    };
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  return txSkeleton;
}

/**
 * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
 *
 * @param txSkeleton
 * @param options
 */
export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();

  return _prepareSigningEntries(txSkeleton, config, "OMNILOCK");
}

export { bitcoin };

export default {
  prepareSigningEntries,
  setupInputCell,
  CellCollector,
  OmnilockWitnessLock,
  createOmnilockScript,
};
