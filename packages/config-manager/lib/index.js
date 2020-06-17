const deepFreeze = require("deep-freeze-strict");
const { readFileSync } = require("fs");
const { env } = require("process");
const predefined = require("./predefined");

function assertHexString(debugPath, string) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(string)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHash(debugPath, hash) {
  assertHexString(debugPath, hash);
  if (hash.length != 66) {
    throw new Error(`${debugPath} must be a hex string of 66 bytes long!`);
  }
}

function assertInteger(debugPath, i) {
  if (i === "0x0") {
    return;
  }
  if (!/^0x[1-9a-fA-F][0-9a-fA-F]*$/.test(i)) {
    throw new Error(`${debugPath} must be a hex integer!`);
  }
}

function validateConfig(config) {
  if (typeof config.PREFIX !== "string") {
    throw new Error("PREFIX must be a string!");
  }
  for (const scriptName of Object.keys(config.SCRIPTS)) {
    const scriptConfig = config.SCRIPTS[scriptName];
    assertHash(`SCRIPTS.${scriptName}.CODE_HASH`, scriptConfig.CODE_HASH);
    const hashType = scriptConfig.HASH_TYPE;
    if (hashType !== "type" && hashType !== "data") {
      throw new Error(
        `SCRIPTS.${scriptName}.HASH_TYPE must either be data or type!`
      );
    }
    assertHash(`SCRIPTS.${scriptName}.TX_HASH`, scriptConfig.TX_HASH);
    assertInteger(`SCRIPTS.${scriptName}.INDEX`, scriptConfig.INDEX);
    const depType = scriptConfig.DEP_TYPE;
    if (depType !== "dep_group" && depType !== "code") {
      throw new Error(
        `SCRIPTS.${scriptName}.DEP_TYPE must either be dep_group or code!`
      );
    }
    const shortId = scriptConfig.SHORT_ID;
    // Short ID is optional
    if (shortId != undefined) {
      if (typeof shortId !== "number") {
        throw new Error("SHORT_ID must be a number!");
      }
    }
  }
}

let config = predefined.LINA;

function getConfig() {
  return config;
}

function initializeConfig() {
  if (env.LUMOS_CONFIG_NAME && predefined[env.LUMOS_CONFIG_NAME]) {
    config = predefined[env.LUMOS_CONFIG_NAME];
    return;
  }
  const configFilename = env.LUMOS_CONFIG_FILE || "config.json";
  try {
    const data = readFileSync(configFilename);
    const loadedConfig = JSON.parse(data);
    validateConfig(loadedConfig);
    config = deepFreeze(loadedConfig);
  } catch (e) {
    throw new Error(`Error loading config from file ${configFilename}: ${e}`);
  }
}

module.exports = {
  getConfig,
  initializeConfig,
  predefined,
  validateConfig,
};
