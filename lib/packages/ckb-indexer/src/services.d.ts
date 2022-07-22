import { ScriptWrapper, HexString } from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, SearchKey } from "./type";
declare function instanceOfScriptWrapper(object: unknown): object is ScriptWrapper;
declare const generateSearchKey: (queries: CKBIndexerQueryOptions) => SearchKey;
declare const getHexStringBytes: (hexString: HexString) => number;
declare const requestBatch: (rpcUrl: string, data: unknown) => Promise<any>;
declare const request: (ckbIndexerUrl: string, method: string, params?: any) => Promise<any>;
export { generateSearchKey, getHexStringBytes, instanceOfScriptWrapper, requestBatch, request, };
