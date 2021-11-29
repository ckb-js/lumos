/** Deployed script on chain */
export interface ScriptConfig {
  CODE_HASH: string;
  HASH_TYPE: "type" | "data";
  TX_HASH: string;
  INDEX: string;
  DEP_TYPE: "dep_group" | "code";
  /**
   * Short ID for creating CKB address, not all scripts have short IDs.
   * @deprecated The short address will be removed in the future. If you need to generate short address,
   *  please use the `generateAddress(script, { __generateShortAddressWhenShortIDInConfig: true })`
   */
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
