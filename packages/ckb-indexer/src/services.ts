import { utils, HexString } from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, SearchKey } from "./type";
import fetch from "cross-fetch";
import {
  instanceOfScriptWrapper,
  convertQueryOptionToSearchKey,
} from "./ckbIndexerFilter";

const generateSearchKey = (queries: CKBIndexerQueryOptions): SearchKey => {
  return convertQueryOptionToSearchKey(queries);
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

export {
  generateSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
  requestBatch,
};
