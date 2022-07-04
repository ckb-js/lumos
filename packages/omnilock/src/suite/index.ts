import { predefined } from "./../../../config-manager/src/predefined";
import { core, Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { AuthPart, OmnilockInfo, OmnilockSuite, SigningInfo } from "../types";
import { LockArgsCodec, OmnilockWitnessLock } from "../codecs";
import { unimplemented } from "../utils";
import { isP2PKHHint, p2pkh } from "./p2pkh";

export interface DefaultOmnilockSuiteConfig {
  scriptConfig: ScriptConfig;
  authHints: AuthPart[];
}

export function createDefaultOmnilockSuite(
  config: DefaultOmnilockSuiteConfig
): OmnilockSuite {
  let _signingEntries: SigningInfo[] | null = null;
  const { scriptConfig, authHints } = config;
  return {
    get scriptConfig() {
      return scriptConfig;
    },

    get authHints() {
      return authHints;
    },

    createOmnilockScript(options: OmnilockInfo): Script {
      const { CODE_HASH, HASH_TYPE } = scriptConfig;
      const {
        auth,
        feature = { omnilockFlags: {}, omnilockArgs: {} },
      } = options;

      const authContent = (() => {
        if (
          auth.authFlag === "ETHEREUM" ||
          auth.authFlag === "SECP256K1_BLAKE160"
        ) {
          return auth.options.pubkeyHash;
        }
        unimplemented();
      })();

      const args = hexify(
        LockArgsCodec.pack({
          authFlag: auth.authFlag,
          authContent: authContent,
          ...feature,
        })
      );

      return { code_hash: CODE_HASH, hash_type: HASH_TYPE, args: args };
    },

    async adjust(txSkeleton) {
      let adjustedTxSkeleton = txSkeleton;
      adjustedTxSkeleton = adjustedTxSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          out_point: {
            tx_hash: scriptConfig.TX_HASH,
            index: scriptConfig.INDEX,
          },
          dep_type: scriptConfig.DEP_TYPE,
        })
      );
      adjustedTxSkeleton = adjustedTxSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          out_point: {
            tx_hash: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
            index: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
          },
          dep_type: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
        })
      );

      const p2pkhAdjusted = p2pkh(adjustedTxSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isP2PKHHint),
      });

      adjustedTxSkeleton = p2pkhAdjusted.adjusted;

      const signingEntries = p2pkhAdjusted.signingEntries;
      _signingEntries = signingEntries;
      return { adjusted: adjustedTxSkeleton, signingEntries };
    },

    async seal(txSkeleton, sign) {
      if (_signingEntries === null) {
        throw new Error(
          "No signing entry found! Please adjust tx before sealing tx."
        );
      }
      for (const signingEntry of _signingEntries) {
        if (isP2PKHHint(signingEntry.authHint)) {
          const signedMessage = await sign(signingEntry);
          const signedWitness = hexify(
            core.SerializeWitnessArgs({
              lock: OmnilockWitnessLock.pack({ signature: signedMessage })
                .buffer,
            })
          );
          txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
            witnesses.set(signingEntry.index, signedWitness)
          );
        } else {
          unimplemented();
        }
      }
      return txSkeleton;
    },
  };
}
