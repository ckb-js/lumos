import { Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { AuthPart, OmnilockInfo, OmnilockSuite } from "../types";
import { LockArgsCodec } from "../codecs";
import { unimplemented } from "../utils";
import { isP2PKHHint, p2pkh } from "./p2pkh";
import { adjustMultisig, isMultisigHint } from "./multisig";
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
      let adjustedSkeleton = p2pkh(txSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isP2PKHHint),
      });

      adjustedSkeleton = adjustMultisig(txSkeleton, {
        config: scriptConfig,
        hints: authHints.filter(isMultisigHint),
      });

      return adjustedSkeleton;
    },

    async seal(txSkeleton, sign) {
      const group = createP2PKHMessageGroup(txSkeleton, [
        /*hint to script*/
      ]);

      // TODO inject signed message to txSkeleton witness
      console.log(group);
      console.log(sign);

      unimplemented();
    },
  };
}
