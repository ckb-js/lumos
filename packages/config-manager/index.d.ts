export interface ScriptConfig {
  CODE_HASH: string;
  HASH_TYPE: "type" | "data";
  TX_HASH: string;
  INDEX: string;
  DEP_TYPE: "dep_group" | "code";
  SHORT_ID?: number;
}

export interface ScriptConfigs {
  [field: string]: ScriptConfig;
}

export interface Config {
  PREFIX: string;
  SCRIPTS: ScriptConfigs;
}

export function loadConfig(): Config;
export function initializeConfig(): void;
export const predefined: ScriptConfigs;
