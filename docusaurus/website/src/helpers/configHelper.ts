import { config } from "@ckb-lumos/lumos";

export function toConfigWithoutShortId(
  configWithShortId: config.Config
): config.Config {
  const configScripts = configWithShortId.SCRIPTS;
  const newConfigScript: Record<string, config.ScriptConfig> = {};
  for (let key in configScripts) {
    const s = configScripts[key];
    newConfigScript[key] = {
      CODE_HASH: s.CODE_HASH,
      HASH_TYPE: s.HASH_TYPE,
      TX_HASH: s.TX_HASH,
      INDEX: s.INDEX,
      DEP_TYPE: s.DEP_TYPE,
    };
  }
  return config.CKB2019({
    PREFIX: configWithShortId.PREFIX,
    SCRIPTS: newConfigScript,
  });
}
