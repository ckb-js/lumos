import { HexString } from "@ckb-lumos/base";
import { BytesLikeCodec } from "@ckb-lumos/codec/lib/base";
import { createBytesCodec } from "@ckb-lumos/codec";
import { Uint8 } from "@ckb-lumos/codec/lib/number";
import { invertKV, isKeyOf } from "./utils";
import { concat } from "@ckb-lumos/codec/lib/bytes";
import { createFixedHexBytesCodec } from "@ckb-lumos/codec/lib/blockchain";

export const AUTH_FLAG = {
  SECP256K1_BLAKE160: 0x00,

  ETHEREUM: 0x01,
  EOS: 0x02,
  TRON: 0x03,
  BITCON: 0x04,
  DEGE: 0x05,

  /**
   * It follows the same unlocking method used by [CKB MultiSig]{@link https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_multisig_all.c}
   */
  MULTISIG: 0x06,
  P2SH: 0xfc,
  EXEC: 0xfd,
  DYNAMIC_LINKING: 0xfe,
} as const;

export type AuthType = keyof typeof AUTH_FLAG;

export const OMNILOCK_FLAG = {
  ADMINISTRATOR: 0b00000001,
  ANYONE_CAN_PAY: 0b00000010,
  TIME_LOCK: 0b00000100,
  SUPPLY: 0b00001000,
};

export type OmniFlagType = keyof typeof OMNILOCK_FLAG;
export type OmnilockFlags = { [key in OmniFlagType]?: boolean };

type MinimalACPPower = { ckb: number; udt: number };

export interface OmnilockArgs {
  /**
   * When "administrator mode" is enabled, <32 byte RC cell type ID> must be present.
   * The RC cell type ID contains the type script hash used by a special cell with the same format as RCE Cell.
   * RC cell follows a set of rules and contains whitelists and blacklists.
   * These lists can be used in the SMT proofs scenarios.
   */
  rcCellTypeId?: HexString;
  /**
   * When anyone-can-pay mode is enabled, <2 bytes minimum ckb/udt in ACP> must be present.
   * It follows the rules of anyone-can-pay lock.
   * The <1 byte CKByte minimum> and <1 byte UDT minimum> are present at the same time.
   */
  minimalACPPower?: MinimalACPPower;
  /**
   * When time-lock mode is enabled, <8 bytes since for time lock> must be present.
   * The check_since is used. The input parameter since is obtained from <8 bytes since for time lock>.
   */
  timeLockSince?: HexString;
  /**
   * When supply mode is enabled, <32 bytes type script hash> must be present.
   * The cell data of info cell which is specified by type script hash has the following data structure:
   * ```
   * version (1 byte)
   * current supply (16 bytes, little endian number)
   * max supply (16 bytes, little endian number)
   * sUDT script hash (32 bytes, sUDT type script hash)
   * ... (variable length, other data)
   * ```
   */
  supplyScriptHash?: HexString;
}

export interface LockArgs {
  /**
   * Omnilock introduces a new concept, authentication ( auth ) to CKB lock scripts: an auth is a 21-byte data structure containing the following components:
   * ```
   * <1 byte flag> <20 bytes auth content>
   * ```
   *
   * Depending on the value of the flag, the auth content has the following interpretations:
   *
   * 0x0: The auth content represents the blake160 hash of a secp256k1 public key.
   * The lock script will perform secp256k1 signature verification, the same as the SECP256K1/blake160 lock.
   *
   * 0x01~0x05: It follows the same unlocking methods used by PW-lock
   *
   * 0x06: It follows the same unlocking method used by CKB MultiSig
   *
   * 0xFC: The auth content that represents the blake160 hash of a lock script.
   * The lock script will check if the current transaction contains an input cell with a matching lock script.
   * Otherwise, it would return with an error. It's similar to P2SH in BTC.
   *
   * 0xFD: The auth content that represents the blake160 hash of a preimage.
   * The preimage contains exec information that is used to delegate signature verification to another script via exec.
   *
   * 0xFE: The auth content that represents the blake160 hash of a preimage.
   * The preimage contains dynamic linking information that is used to delegate signature verification to the dynamic linking script.
   * The interface described in Swappable Signature Verification Protocol Spec is used here.
   */
  authFlag: AuthType;
  /**
   * @see authFlag
   */
  authContent: HexString;

  /**
   * | Name                | Flag       | Affected Args               | Affected Args Size (byte) | Affected Witness                               |
   * |---------------------|------------|-----------------------------|---------------------------|------------------------------------------------|
   * | administrator mode  | 0b00000001 | RC cell type ID             | 32                        | omni_identity/signature in OmniLockWitnessLock |
   * | anyone-can-pay mode | 0b00000010 | minimum ckb/udt in ACP      | 2                         | N/A                                            |
   * | time-lock mode      | 0b00000100 | since for timelock          | 8                         | N/A                                            |
   * | supply mode         | 0b00001000 | type script hash for supply | 32                        | N/A                                            |
   * | auth                | N/A        | 21-byte auth identity       | 21                        | signature in OmniLockWitnessLock               |
   */
  omnilockFlags: OmnilockFlags;
  /**
   * @see omnilockFlags
   */
  omnilockArgs: OmnilockArgs;
}

const AUTH_FLAG_INVERTED = invertKV(AUTH_FLAG);

export const OmniAuthCodec: BytesLikeCodec<AuthType> = createBytesCodec({
  pack: (authType) => {
    if (!isKeyOf(AUTH_FLAG, authType)) {
      throw new Error(`Invalid auth type: ${authType}`);
    }

    return Uint8.pack(AUTH_FLAG[authType]);
  },
  unpack: (u8) => {
    const authType = Uint8.unpack(u8);

    if (!isKeyOf(AUTH_FLAG_INVERTED, authType)) {
      throw new Error(`Invalid auth type: ${authType}`);
    }

    return AUTH_FLAG_INVERTED[authType as keyof typeof AUTH_FLAG_INVERTED];
  },
});

const Byte8 = createFixedHexBytesCodec(8);
const Byte20 = createFixedHexBytesCodec(20);
const Byte32 = createFixedHexBytesCodec(32);

const OmniArgsCodec: BytesLikeCodec<{
  omnilockFlags: OmnilockFlags;
  omnilockArgs: OmnilockArgs;
}> = createBytesCodec({
  pack: (obj) => {
    const {
      ANYONE_CAN_PAY,
      SUPPLY,
      TIME_LOCK,
      ADMINISTRATOR,
    } = obj.omnilockFlags;

    // TODO throw error when mixed invalid flags

    const flags =
      ((ADMINISTRATOR && OMNILOCK_FLAG.ADMINISTRATOR) || 0) |
      ((ANYONE_CAN_PAY && OMNILOCK_FLAG.ANYONE_CAN_PAY) || 0) |
      ((SUPPLY && OMNILOCK_FLAG.SUPPLY) || 0) |
      ((TIME_LOCK && OMNILOCK_FLAG.TIME_LOCK) || 0);

    const omnilockFlags = Uint8.pack(flags);

    const {
      rcCellTypeId,
      minimalACPPower,
      timeLockSince,
      supplyScriptHash,
    } = obj.omnilockArgs;

    // TODO throw error when invalid args

    const omnilockArgs = concat(
      rcCellTypeId ? Byte32.pack(rcCellTypeId) : "0x",
      minimalACPPower
        ? concat(
            Uint8.pack(minimalACPPower.ckb),
            Uint8.pack(minimalACPPower.udt)
          )
        : "0x",
      timeLockSince ? Byte8.pack(timeLockSince) : "0x",
      supplyScriptHash ? Byte32.pack(supplyScriptHash) : "0x"
    );

    return concat(omnilockFlags, omnilockArgs);
  },
  unpack: (bytes) => {
    const flagsByte = bytes.slice(0, 1);
    const args = bytes.slice(1);

    const flags = Uint8.unpack(flagsByte);

    const omnilockFlags: OmnilockFlags = {
      ADMINISTRATOR: !!(flags & OMNILOCK_FLAG.ADMINISTRATOR),
      ANYONE_CAN_PAY: !!(flags & OMNILOCK_FLAG.ANYONE_CAN_PAY),
      TIME_LOCK: !!(flags & OMNILOCK_FLAG.TIME_LOCK),
      SUPPLY: !!(flags & OMNILOCK_FLAG.SUPPLY),
    };

    const { ADMINISTRATOR, ANYONE_CAN_PAY, TIME_LOCK, SUPPLY } = omnilockFlags;

    let pointer = 0;

    const rcCellTypeId: HexString | undefined = (() => {
      if (!ADMINISTRATOR) return undefined;
      return Byte32.unpack(args.slice(pointer, (pointer += 32)));
    })();

    const minimalACPPower: MinimalACPPower | undefined = (() => {
      if (!ANYONE_CAN_PAY) return undefined;

      const ckb = Uint8.unpack(args.slice(pointer, (pointer += 1)));
      const udt = Uint8.unpack(args.slice(pointer, (pointer += 1)));

      return { ckb, udt };
    })();

    const timeLockSince: HexString | undefined = (() => {
      if (!TIME_LOCK) return undefined;
      return Byte8.unpack(args.slice(pointer, (pointer += 8)));
    })();

    const supplyScriptHash: HexString | undefined = (() => {
      if (!SUPPLY) return undefined;
      return Byte32.unpack(args.slice(pointer, (pointer += 32)));
    })();

    return {
      omnilockFlags,
      omnilockArgs: {
        rcCellTypeId,
        minimalACPPower,
        timeLockSince,
        supplyScriptHash,
      },
    };
  },
});

/**
 * @example
 *
 * ```js
 * const args = LockArgsCodec.pack({
 *   authFlag: "ETHEREUM",
 *   authContent: "0x1234567812345678123456781234567812345678",
 *   omnilockFlags: { ADMINISTRATOR: false, ANYONE_CAN_PAY: true, TIME_LOCK: false, SUPPLY: false },
 *   omnilockArgs: {
 *     minimalACPPower: { ckb: 0, udt: 0 },
 *   },
 * });
 * ```
 */
export const LockArgsCodec: BytesLikeCodec<LockArgs> = createBytesCodec({
  pack(obj) {
    const auth = OmniAuthCodec.pack(obj.authFlag);
    const authContent = Byte20.pack(obj.authContent);
    const args = OmniArgsCodec.pack(obj);

    return concat(auth, authContent, args);
  },
  unpack(bytes): LockArgs {
    if (bytes.length < 21) {
      throw new Error(
        `Invalid lock args length: ${bytes.length}, expected at least 21`
      );
    }

    return {
      authFlag: OmniAuthCodec.unpack(bytes.slice(0, 1)),
      authContent: Byte20.unpack(bytes.slice(1, 21)),
      ...OmniArgsCodec.unpack(bytes.slice(21)),
    };
  },
});
