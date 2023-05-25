/** Deployed script on chain */
export interface ScriptConfig {
  CODE_HASH: string;
  HASH_TYPE: "type" | "data" | "data1";
  TX_HASH: string;
  INDEX: string;
  DEP_TYPE: "depGroup" | "code";
  /**
   * @deprecated the short address will be removed in the future
   * Short ID for creating CKB address, not all scripts have short IDs.
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
