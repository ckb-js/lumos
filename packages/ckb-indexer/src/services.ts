import { Script, ScriptWrapper } from "@ckb-lumos/base";
import { CkbQueryOptions, HexadecimalRange, SearchFilter } from "./indexer";
import { ScriptType, SearchKey } from "./indexer";
import fetch from "cross-fetch";

function instanceOfScriptWrapper(object: unknown): object is ScriptWrapper {
  return typeof object === "object" && object != null && "script" in object;
}
const unWrapScript = (inputScript: ScriptWrapper | Script): Script => {
  if (instanceOfScriptWrapper(inputScript)) {
    return inputScript.script;
  }
  return inputScript;
};
const generatorSearchKey = (queries: CkbQueryOptions): SearchKey => {
  let script: Script | undefined = undefined;
  const filter: SearchFilter = {};
  let script_type: ScriptType | undefined = undefined;
  if (queries.lock) {
    const lock = unWrapScript(queries.lock);
    script = lock as Script;
    script_type = ScriptType.lock;
    if (queries.type && typeof queries.type !== "string") {
      const type = unWrapScript(queries.type);
      filter.script = type as Script;
    }
  } else if (queries.type && typeof queries.type !== "string") {
    const type = unWrapScript(queries.type);
    script = type as Script;
    script_type = ScriptType.type;
  }
  let block_range: HexadecimalRange | null = null;
  if (queries.fromBlock && queries.toBlock) {
    //toBlock+1 cause toBlock need to be included
    block_range = [
      queries.fromBlock,
      `0x${(BigInt(queries.toBlock) + 1n).toString(16)}`,
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
  if (!script) {
    throw new Error("Either lock or type script must be provided!");
  }
  if (!script_type) {
    throw new Error("script_type must be provided");
  }
  return {
    script,
    script_type,
    filter,
  };
};

const getHexStringBytes = (hexString: string) => {
  return Math.ceil(hexString.substr(2).length / 2);
};

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

const request = async (
  ckbIndexerUrl: string,
  method: string,
  params?: any
): Promise<any> => {
  const res = await fetch(ckbIndexerUrl, {
    method: "POST",
    body: JSON.stringify({
      id: 0,
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (res.status !== 200) {
    throw new Error(`indexer request failed with HTTP code ${res.status}`);
  }
  const data = await res.json();
  if (data.error !== undefined) {
    throw new Error(
      `indexer request rpc failed with error: ${JSON.stringify(data.error)}`
    );
  }
  return data.result;
};

export {
  generatorSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
  requestBatch,
  request,
};
