import { predefined } from "@ckb-lumos/config-manager/lib/predefined";

export const TESTNET = predefined.AGGRON4;
export const MAINNET = predefined.LINA;

export {
  /**
   * @deprecated Use {@link TESTNET} or {@link MAINNET} instead.
   */
  predefined,
  type Config,
  type ScriptConfig,
  type ScriptConfigs,
  createConfig,
  generateGenesisScriptConfigs,
  validateConfig,
  initializeConfig,
  getConfig,
  /**
   * @deprecated use the {@link nameOfScript} and {@link findConfigByScript} function instead
   */
  helpers,
} from "@ckb-lumos/config-manager";

export {
  nameOfScript,
  findConfigByScript,
} from "@ckb-lumos/config-manager/lib/helpers";
