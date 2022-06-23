import { Address, Hash, HexString, Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { BIish } from "@ckb-lumos/bi";
import { AuthType, OmnilockArgs, OmnilockFlags } from "../codecs";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";

export type LockLike = Script | Address;

export type AuthBy<T extends AuthType, C> = {
  authFlag: T;
  options: C;
};

export type PubkeyHashAuthType = "SECP256K1_BLAKE160" | "ETHEREUM";
// unimplemented
// | "EOS"
// | "TRON"
// | "BITCOIN"
// | "DOGE";
export type AuthByP2PKH = AuthBy<PubkeyHashAuthType, { pubkeyHash: HexString }>;

export type AuthByMultiSig = AuthBy<
  "MULTISIG",
  {
    /** first nth public keys must match, 1 byte */
    R: number;
    /** threshold, 1 byte */
    M: number;
    /** blake160 hashes of compressed public keys */
    publicKeyHashes: Hash[];
  }
>;

export type AuthByP2SH = AuthBy<"P2SH", { scriptHash: Hash }>;

export type AuthByDynamicLinking = AuthBy<
  "DYNAMIC_LINKING",
  { config: ScriptConfig }
>;

export type AuthByExec = AuthBy<
  "EXEC",
  {
    pubkeyHash: HexString;
    place: BIish;
    bounds: BIish;
    config: ScriptConfig;
  }
>;

export type AuthPart =
  | AuthByP2PKH
  | AuthByMultiSig
  | AuthByP2SH
  | AuthByDynamicLinking
  | AuthByExec;

export type FeaturePart = {
  omnilockFlags: OmnilockFlags;
  omnilockArgs: OmnilockArgs;
};

export type OmnilockInfo = {
  auth: AuthPart;
  feature?: FeaturePart;
};

export type SigningHint = {
  script: Script;
  // index of witnesses
  // also represents the index of inputs or outputs
  index: number;
  // unsigned witness arg item, not the total WitnessArg, usually WitnessArg.lock
  // e.g. 0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
  witnessArgItem: HexString;
  // signature offset of witnessArgItem, e.g. 0 for secp256k1_blake160
  signatureOffset: number;
  // byte length of signature, e.g. 65 for secp256k1_blake160
  signatureLength: number;
};

/**
 * normally `UnsignedMsg` is a bytes,
 * but typed messages may be supported in the future,
 * so preserve scalability first
 */
export type SigningEntry<UnsignedMsg = HexString> = SigningHint & {
  // message for signing
  message: UnsignedMsg;
};

export type AdjustedSkeleton = TransactionSkeletonType;

export interface OmnilockSuite {
  readonly scriptConfig: ScriptConfig;
  /**
   * helps Omnilock suite to handle the {@link LockArgs.authContent authContent}
   */
  readonly authHints: AuthPart[];

  createOmnilockScript(options: OmnilockInfo): Script;

  /**
   * this method helps to
   * 1. inject the cellDeps if not exists
   * 2. inject omnilock witness placeholder if not exists
   * @param txSkeleton
   */
  adjust(txSkeleton: TransactionSkeletonType): Promise<AdjustedSkeleton>;

  seal(
    txSkeleton: TransactionSkeletonType,
    sign: (
      entry: SigningEntry & { authHint: AuthPart }
    ) => HexString | Promise<HexString>
  ): Promise<TransactionSkeletonType>;
}

export * from "./CommonAdapter";
