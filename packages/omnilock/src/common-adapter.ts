import { CommonAdapter, OmnilockSuite } from "./types";
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

export function createCommonAdapter(suite: OmnilockSuite): CommonAdapter {
  console.log(suite);

  return {
    adapt(): LockScriptInfo {
      unimplemented();
    },
  };
}
