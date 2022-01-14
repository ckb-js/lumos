export function toConfigWithoutShortId(configWithShortId) {
  const configScripts = configWithShortId.SCRIPTS;
  const newConfigScript = new Array();
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
  const configWithoutShortId = {
    CKB2019: true,
    PREFIX: configWithShortId.PREFIX,
    SCRIPTS: newConfigScript,
  };
  return configWithoutShortId;
}
