import { predefined } from "./../../../config-manager/src/predefined";
import { toolkit, utils, helpers } from "@ckb-lumos/lumos";
import { HexString } from "./../../../base/lib/primitive.d";
import { core, Script, Transaction } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import { AuthPart, OmnilockInfo, OmnilockSuite, SigningEntry } from "../types";
import { LockArgsCodec, OmnilockWitnessLock } from "../codecs";
import { unimplemented } from "../utils";
import { isP2PKHHint, p2pkh } from "./p2pkh";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { adjustMultisig, isMultisigHint } from "./multisig";
import { CKBHasher } from "@ckb-lumos/base/lib/utils";

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
        } else if (auth.authFlag === "MULTISIG") {
          const r = Number(auth.options.R).toString(16).padStart(2, "0");
          const m = Number(auth.options.M).toString(16).padStart(2, "0");
          const n = Number(auth.options.publicKeyHashes.length)
            .toString(16)
            .padStart(2, "0");
          const multisigScript = `0x00${r}${m}${n}${auth.options.publicKeyHashes
            .map((hash) => hash.slice(2))
            .join("")}`;
          console.log("createOmnilockScript", multisigScript);
          const multisigLock: Script = {
            code_hash:
              predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.CODE_HASH,
            hash_type:
              predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.HASH_TYPE,
            args: new CKBHasher()
              .update(multisigScript)
              .digestHex()
              .slice(0, 42),
          };
          return utils.computeScriptHash(multisigLock).slice(0, 42);
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
      let adjustedSkeleton = p2pkh(txSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isP2PKHHint),
      });

      adjustedSkeleton = adjustMultisig(txSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isMultisigHint),
      });

      adjustedSkeleton = adjustedSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          out_point: {
            tx_hash: scriptConfig.TX_HASH,
            index: scriptConfig.INDEX,
          },
          dep_type: scriptConfig.DEP_TYPE,
        })
      );
      adjustedSkeleton = adjustedSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          out_point: {
            tx_hash: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
            index: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
          },
          dep_type: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
        })
      );
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
      await Promise.all(
        groups.map(async (group) => {
          const currentGroupLockHash = utils.computeScriptHash(group.lock);
          const currentAuthPart = scriptHashToAuthMap[currentGroupLockHash];
          const signingEntryWithAuthHint: Array<
            SigningEntry & { authHint: AuthPart }
          > = [];
          if (isP2PKHHint(currentAuthPart)) {
            signingEntryWithAuthHint.push({
              script: group.lock,
              index: group.index,
              witnessArgItem: txSkeleton.get("witnesses").get(group.index)!,
              signatureOffset: 0,
              signatureLength: 65,
              message: group.message,
              authHint:
                scriptHashToAuthMap[utils.computeScriptHash(group.lock)],
            });
            const signedMessage = await sign(signingEntryWithAuthHint[0]);
            const signedWitness = hexify(
              core.SerializeWitnessArgs({
                lock: OmnilockWitnessLock.pack({ signature: signedMessage })
                  .buffer,
              })
            );
            txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
              witnesses.set(signingEntryWithAuthHint[0].index, signedWitness)
            );
          } else if (isMultisigHint(currentAuthPart)) {
            const r = Number(currentAuthPart.options.R)
              .toString(16)
              .padStart(2, "0");
            const m = Number(currentAuthPart.options.M)
              .toString(16)
              .padStart(2, "0");
            const n = Number(currentAuthPart.options.publicKeyHashes.length)
              .toString(16)
              .padStart(2, "0");
            const multisigScript = `0x00${r}${m}${n}${currentAuthPart.options.publicKeyHashes
              .map((hash) => hash.slice(2))
              .join("")}`;
            for (
              let nthHint = 0;
              nthHint < currentAuthPart.options.M;
              nthHint++
            ) {
              signingEntryWithAuthHint.push({
                script: group.lock,
                index: group.index,
                witnessArgItem: txSkeleton.get("witnesses").get(group.index)!,
                signatureOffset:
                  65 * nthHint + bytify(multisigScript).byteLength,
                signatureLength: 65,
                message: group.message,
                authHint:
                  scriptHashToAuthMap[utils.computeScriptHash(group.lock)],
              });
            }
          } else {
            throw new Error("Not supported auth");
          }
        })
      );
      return txSkeleton;
    },
  };
}
