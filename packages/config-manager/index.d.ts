/** Deployed script on chain */
export interface ScriptConfig {
  CODE_HASH: string;
  HASH_TYPE: "type" | "data";
  TX_HASH: string;
  INDEX: string;
  DEP_TYPE: "dep_group" | "code";
  /** Short ID for creating CKB address, not all scripts have short IDs. */
  SHORT_ID?: number;
}

export interface ScriptConfigs {
  [field: string]: ScriptConfig | undefined;
}

/**
 * Each config is associated with one chain instance. It might have its
 * own address prefix, and its own set of deployed scripts.
 */
export interface Config {
  PREFIX: string;
  SCRIPTS: ScriptConfigs;
}

/**
 * Get current loaded Config.
 *
 * @returns Config object which represents the current running chain.
 */
export function getConfig(): Config;
/**
 * Initialize current app with a config. The initializaton steps work as follows:
 * 1. If `LUMOS_CONFIG_NAME` environment variable is set to a predefined config,
 * the predefined config is loaded;
 * 2. If `LUMOS_CONFIG_FILE` environment variable is set, it will be used as the
 * name of a file containing the Config to use.
 * 3. A file named `config.json` in current running directory will be used as the
 * file containing the Config to use.
 *
 * @returns void
 */
export function initializeConfig(): void;
/** An object containing predefined configs. */
export const predefined: ScriptConfigs;
