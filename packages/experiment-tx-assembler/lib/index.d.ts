import { Script, CellDep, HexString, OutPoint, Hash, HexNumber, Cell } from "@ckb-lumos/base";
import { BIish } from "@ckb-lumos/bi";
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
interface Payload {
    lock: Script;
    type?: Script;
    capacity: BIish;
    data?: HexString;
    out_point?: OutPoint;
    block_hash?: Hash;
    block_number?: HexNumber;
}
export declare function createCell(payload: Payload, options?: {
    skipCheckCapacityIsEnough?: boolean;
}): Cell;
export declare function createCellWithMinimalCapacity(payload: {
    lock: Script;
    type?: Script;
    data?: HexString;
}): Cell;
export {};
