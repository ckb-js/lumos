import { OmnilockInfo, OmnilockSuite, SigningPoint } from "./types";
import { Script } from "@ckb-lumos/base";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { LockArgsCodec } from "./codecs";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { unimplemented } from "./utils";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";

export interface DefaultOmnilockSuiteConfig {
  scriptConfig: ScriptConfig;
}

export function createDefaultOmnilockSuite(
  config: DefaultOmnilockSuiteConfig
): OmnilockSuite {
  const { scriptConfig } = config;

  return {
    createOmnilockScript(options: OmnilockInfo): Script {
      const { CODE_HASH, HASH_TYPE } = scriptConfig;
      const { auth, feature } = options;

      const authContent = (() => {
        if (
          auth.authFlag === "ETHEREUM" ||
          auth.authFlag === "SECP256K1_BLAKE160"
        ) {
          return auth.options.pubkeyHash;
        }

        // TODO
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

    adjustWitness(): // txSkeleton: TransactionSkeletonType,
    // authInfos: AuthPart[]
    Promise<[TransactionSkeletonType, SigningPoint[]]> {
      unimplemented();
    },
  };
}
