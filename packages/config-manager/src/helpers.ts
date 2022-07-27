import { Script } from "@ckb-lumos/base";
import { ScriptConfig, ScriptConfigs } from "./types";
import { getConfig } from "./manager";

type ScriptTemplate = Omit<Script, "args">;

export function findConfigByScript(
  scriptTemplate: ScriptTemplate,
  SCRIPTS?: ScriptConfigs
): ScriptConfig | undefined {
  const scripts = SCRIPTS || getConfig().SCRIPTS;

  return Object.values(scripts).find(
    (item) =>
      item?.CODE_HASH === scriptTemplate.codeHash && item?.HASH_TYPE === scriptTemplate.hashType
  );
}

/**
 *
 * We may need to determine if a `scriptTemplate` is a kind of ScriptConfig
 *
 * ```typescript
 * if (keyOfScript({ codeHash... })  === 'SECP256K1')  {
 *   // ...
 * }
 * ```
 * @param scriptTemplate
 * @param SCRIPTS
 */
export function nameOfScript<S extends ScriptConfigs>(
  scriptTemplate: ScriptTemplate,
  SCRIPTS?: ScriptConfigs
): keyof S | undefined {
  const scripts = SCRIPTS || getConfig().SCRIPTS;

  const foundEntry = Object.entries(scripts).find(
    ([, config]) =>
      config?.CODE_HASH === scriptTemplate.codeHash && config?.HASH_TYPE === scriptTemplate.hashType
  );

  if (!foundEntry) return undefined;
  return foundEntry[0];
}
