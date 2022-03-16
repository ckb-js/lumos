import {Address, config, helpers, Script} from "@ckb-lumos/lumos";

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
  return {
    PREFIX: configWithShortId.PREFIX,
    SCRIPTS: newConfigScript,
  };
}

export function hasShortId(address: Address, cfg: config.Config): boolean {
  const script = helpers.parseAddress(address);
  const found = findInConfig(script, cfg);
  if (found && found.SHORT_ID !== undefined) {
    return true;
  }
  return false;
}

function findInConfig(script: Script, cfg: config.Config): config.ScriptConfig | undefined {
  const configScripts = cfg.SCRIPTS;
  let cfgScript = undefined;
  for (let key in configScripts) {
    const s = configScripts[key];
    if (s.CODE_HASH === script.code_hash && s.HASH_TYPE === script.hash_type) {
      cfgScript = s;
    }
  }
  return cfgScript;
}
