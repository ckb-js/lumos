import { predefined } from "./../../../config-manager/src/predefined";
import { utils } from "@ckb-lumos/lumos";
import { HexString } from "./../../../base/lib/primitive.d";
import { core, Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { AuthPart, OmnilockInfo, OmnilockSuite } from "../types";
import { LockArgsCodec, OmnilockWitnessLock } from "../codecs";
import { unimplemented } from "../utils";
import { isP2PKHHint, p2pkh } from "./p2pkh";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";

export interface DefaultOmnilockSuiteConfig {
  scriptConfig: ScriptConfig;
  authHints: AuthPart[];
}

export function createDefaultOmnilockSuite(
  config: DefaultOmnilockSuiteConfig
): OmnilockSuite {
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
      const adjustedSkeleton = p2pkh(txSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isP2PKHHint),
      });

      adjustedSkeleton.adjusted = adjustedSkeleton.adjusted.update(
        "cellDeps",
        (cellDeps) =>
          cellDeps.push({
            out_point: {
              tx_hash: scriptConfig.TX_HASH,
              index: scriptConfig.INDEX,
            },
            dep_type: scriptConfig.DEP_TYPE,
          })
      );
      adjustedSkeleton.adjusted = adjustedSkeleton.adjusted.update(
        "cellDeps",
        (cellDeps) =>
          cellDeps.push({
            out_point: {
              tx_hash: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
              index: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
            },
            dep_type: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
          })
      );

      // adjustedSkeleton = adjustMultisig(txSkeleton, {
      //   config: scriptConfig,
      //   hints: authHints.filter(isMultisigHint),
      // });

      return adjustedSkeleton;
    },

    async seal(txSkeleton, sign) {
      console.log("txskeleton before seal:", JSON.stringify(txSkeleton.toJS()));
      const scriptHashToAuthMap: Record<HexString, AuthPart> = {};
      const scripts: Script[] = authHints.map((auth) => {
        const omniLockScript = this.createOmnilockScript({ auth });
        scriptHashToAuthMap[utils.computeScriptHash(omniLockScript)] = auth;
        return omniLockScript;
      });
      const groups = createP2PKHMessageGroup(txSkeleton, scripts);
      await groups.forEach(async (group) => {
        const signingEntryWithAuthHint = {
          script: group.lock,
          index: group.index,
          witnessArgItem: txSkeleton.get("witnesses").get(group.index)!,
          signatureOffset: 0,
          signatureLength: 65,
          message: group.message,
          authHint: scriptHashToAuthMap[utils.computeScriptHash(group.lock)],
        };
        const signedMessage = await sign(signingEntryWithAuthHint);

        // let v = Number.parseInt(signedMessage.slice(-2), 16);
        // if (v >= 27) v -= 27;
        // signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
        console.log("unsigned message is:", group.message);
        console.log("signed message is:", signedMessage);

        const signedWitness = hexify(
          core.SerializeWitnessArgs({
            lock: OmnilockWitnessLock.pack({ signature: signedMessage }).buffer,
          })
        );

        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(signingEntryWithAuthHint.index, signedWitness)
        );
      });

      return txSkeleton;
    },
  };
}
