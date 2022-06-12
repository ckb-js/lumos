import { CommonAdapter } from "./types";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { LockScriptInfo } from "@ckb-lumos/common-scripts";
import { CellCollectorType } from "@ckb-lumos/common-scripts/src/type";
import { Cell, Script } from "@ckb-lumos/base";
import { unimplemented } from "./utils";

export interface CommonAdapterConfig {
  scriptConfig: ScriptConfig;
}

export class CellCollector implements CellCollectorType {
  readonly fromScript: Script;

  constructor() {
    unimplemented();
  }

  collect(): AsyncGenerator<Cell> {
    unimplemented();
  }
}

export function createCommonAdapter(
  config: CommonAdapterConfig
): CommonAdapter {
  const { CODE_HASH, HASH_TYPE } = config.scriptConfig;

  return {
    adapt(): LockScriptInfo {
      return {
        code_hash: CODE_HASH,
        hash_type: HASH_TYPE,
        lockScriptInfo: {
          CellCollector: CellCollector,
          setupInputCell() // txSkeleton: TransactionSkeletonType,
          // inputCell: Cell,
          // fromInfo?: FromInfo,
          // options?: {
          //   config?: Config;
          //   defaultWitness?: HexString;
          //   since?: PackedSince;
          // }
          {
            unimplemented();
          },
          prepareSigningEntries(/*txSkeleton, options*/) {
            unimplemented();
          },
        },
      };
    },
  };
}
