import deepFreeze from "deep-freeze-strict";
import { Config } from "./types";
import { predefined } from "./predefined";

function assertHexString(debugPath: string, string: string) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(string)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHash(debugPath: string, hash: string) {
  assertHexString(debugPath, hash);
  // 2 for 0x
  // 64 for 32 bytes in hex format
  const hashHexLength = 66;
  if (hash.length !== hashHexLength) {
    throw new Error(`${debugPath} must be a hex string of 66 characters long!`);
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

export function assertHashType(debugPath: string, hashType: string): void {
  if (
    hashType !== "type" &&
    hashType !== "data" &&
    hashType !== "data1" &&
    hashType !== "data2"
  ) {
    throw new Error(`${debugPath} must one of type, data, data1, data2!`);
  }
}

function assert(condition: unknown, debugPath = "variable"): asserts condition {
  if (!condition) throw new Error(`${debugPath} is not valid`);
}

export function validateConfig(config: Config): void {
  assert(
    typeof config.SCRIPTS === "object" && config.SCRIPTS != null,
    "config.SCRIPT"
  );

  for (const scriptName of Object.keys(config.SCRIPTS)) {
    const scriptConfig = config.SCRIPTS[scriptName];

    assert(scriptConfig?.CODE_HASH);

    assertHash(`SCRIPTS.${scriptName}.CODE_HASH`, scriptConfig.CODE_HASH);
    assertHashType(`SCRIPTS.${scriptName}.HASH_TYPE`, scriptConfig.HASH_TYPE);
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

export function initializeConfig(inputConfig: Config): void {
  validateConfig(inputConfig);
  config = deepFreeze(inputConfig);
}
