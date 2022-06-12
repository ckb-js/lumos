import { LockScriptInfo } from "@ckb-lumos/common-scripts";

/**
 * adapter for working with @ckb-lumos/common-scripts
 */
export interface CommonAdapter {
  adapt(): LockScriptInfo;
}
