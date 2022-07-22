import deepFreeze from "deep-freeze-strict";
import { logger } from "@ckb-lumos/base";
import { Config } from "./types";
import { predefined } from "./predefined";

function assertHexString(debugPath: string, string: string) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(string)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHash(debugPath: string, hash: string) {
  assertHexString(debugPath, hash);
  if (hash.length != 66) {
    throw new Error(`${debugPath} must be a hex string of 66 bytes long!`);
  }
}

function assertInteger(debugPath: string, i: string) {
  if (i === "0x0") {
    return;
  }
  if (!/^0x[1-9a-fA-F][0-9a-fA-F]*$/.test(i)) {
    throw new Error(`${debugPath} must be a hex integer!`);
  }
}

function nonNullable(
  condition: unknown,
  debugPath = "variable"
): asserts condition {
  if (!condition) throw new Error(`${debugPath} cannot be nil`);
}

export function validateConfig(config: Config) {
  if (typeof config.SCRIPTS !== "object" || config.SCRIPTS == null)
    throw new Error();

  for (const scriptName of Object.keys(config.SCRIPTS)) {
    const scriptConfig = config.SCRIPTS[scriptName];

    nonNullable(scriptConfig?.CODE_HASH);

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
    if (depType !== "depGroup" && depType !== "code") {
      throw new Error(
        `SCRIPTS.${scriptName}.DEP_TYPE must either be depGroup or code!`
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

let config: Config = predefined.LINA;

export function getConfig(): Config {
  return config;
}

/**
 * Initialize current app with a config. The initializaton steps work as follows:
 * 1. If `LUMOS_CONFIG_NAME` environment variable is set to a predefined config,
 * the predefined config is loaded;
 * 2. If `LUMOS_CONFIG_FILE` environment variable is set, it will be used as the
 * name of a file containing the Config to use.
 * 3. A file named `config.json` in current running directory will be used as the
 * file containing the Config to use.
 * @deprecated
 * @returns void
 */
function initializeConfigLegacy() {
  const env = process?.env;
  const configName = env?.LUMOS_CONFIG_NAME;

  if (
    (configName === "LINA" || configName === "AGGRON4") &&
    predefined[configName]
  ) {
    config = predefined[configName];
    return;
  }

  const configFile = env?.LUMOS_CONFIG_FILE;
  const configFilename = configFile || "config.json";
  try {
    const data = require("fs").readFileSync(configFilename);
    const loadedConfig = JSON.parse(data);
    validateConfig(loadedConfig);
    config = deepFreeze(loadedConfig);
  } catch (e) {
    throw new Error(`Error loading config from file ${configFilename}: ${e}`);
  }
}

export function initializeConfig(inputConfig?: Config): void {
  if (!inputConfig) {
    logger.deprecated(
      "initializeConfig with env will be deprecated, please migrate to initializeConfig(...)"
    );
    initializeConfigLegacy();
  } else {
    validateConfig(inputConfig);
    config = deepFreeze(inputConfig);
  }
}
