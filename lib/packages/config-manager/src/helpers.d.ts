import { Script } from "@ckb-lumos/base";
import { ScriptConfig, ScriptConfigs } from "./types";
declare type ScriptTemplate = Omit<Script, "args">;
export declare function findConfigByScript(scriptTemplate: ScriptTemplate, SCRIPTS?: ScriptConfigs): ScriptConfig | undefined;
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
export declare function nameOfScript<S extends ScriptConfigs>(scriptTemplate: ScriptTemplate, SCRIPTS?: ScriptConfigs): keyof S | undefined;
export {};
