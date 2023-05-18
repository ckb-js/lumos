import { utils, HexString, Script } from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, SearchKey } from "./type";
import fetch from "cross-fetch";
import { BI } from "@ckb-lumos/bi";
import { toScript } from "./paramsFormatter";
import type * as RPCType from "./rpcType";
import { toSearchKey } from "./resultFormatter";
import { unwrapScriptWrapper } from "./ckbIndexerFilter";

const generateSearchKey = (queries: CKBIndexerQueryOptions): SearchKey => {
  let script: RPCType.Script | undefined = undefined;
  const filter: RPCType.SearchFilter = {};
  let script_type: RPCType.ScriptType | undefined = undefined;
  let script_search_mode: RPCType.ScriptSearchMode = "prefix";
  if (queries.lock) {
    const lock = unwrapScriptWrapper(queries.lock);
    script = toScript(lock);
    script_type = "lock";
    if (queries.type && typeof queries.type !== "string") {
      const type = unwrapScriptWrapper(queries.type);
      filter.script = toScript(type);
    }
  } else if (queries.type && typeof queries.type !== "string") {
    const type = unwrapScriptWrapper(queries.type);
    script = toScript(type);
    script_type = "type";
  }
  let block_range: RPCType.HexadecimalRange | null = null;
  if (queries.fromBlock && queries.toBlock) {
    //toBlock+1 cause toBlock need to be included
    block_range = [
      queries.fromBlock,
      `0x${BI.from(queries.toBlock).add(1).toString(16)}`,
    ];
  }
  if (block_range) {
    filter.block_range = block_range;
  }
  if (queries.outputDataLenRange) {
    filter.output_data_len_range = queries.outputDataLenRange;
  }
  if (queries.outputCapacityRange) {
    filter.output_capacity_range = queries.outputCapacityRange;
  }
  if (queries.scriptLenRange) {
    filter.script_len_range = queries.scriptLenRange;
  }
  if (queries.scriptSearchMode) {
    script_search_mode = queries.scriptSearchMode;
  }
  if (!script) {
    throw new Error("Either lock or type script must be provided!");
  }
  if (!script_type) {
    throw new Error("script_type must be provided");
  }
  return toSearchKey({
    script,
    script_type,
    filter,
    script_search_mode,
  });
};

const getHexStringBytes = (hexString: HexString): number => {
  utils.assertHexString("", hexString);
  return Math.ceil(hexString.substr(2).length / 2);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestBatch = async (rpcUrl: string, data: unknown): Promise<any> => {
  const res: Response = await fetch(rpcUrl, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`);
  }
  const result = await res.json();
  if (result.error !== undefined) {
    throw new Error(
      `indexer request rpc failed with error: ${JSON.stringify(result.error)}`
    );
  }
  return result;
};

export { generateSearchKey, getHexStringBytes, requestBatch };
