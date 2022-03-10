import { Script, CellDep } from "@ckb-lumos/base";
import { ScriptConfigs } from "@ckb-lumos/config-manager";
import { Reader } from "@ckb-lumos/toolkit";
interface ScriptRegistry<T extends ScriptConfigs> {
    extend: <T1 extends ScriptConfigs>(newPayload: T1) => ScriptRegistry<T & T1>;
    newScript: (key: keyof T, args: string | Reader) => Script;
    isScriptOf: (key: keyof T, script: Script) => boolean;
    newCellDep: (key: keyof T) => CellDep;
    nameOfScript: (script: Script) => keyof T | undefined;
}
export declare function createScriptRegistry<T extends ScriptConfigs>(payload: T): ScriptRegistry<T>;
export {};
