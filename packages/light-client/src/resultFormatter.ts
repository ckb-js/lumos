/* eslint-disable camelcase, @typescript-eslint/no-explicit-any */
import {
  LightClientRPC,
  FetchHeaderResult,
  FetchTransactionResult,
  LightClientScript,
  FetchFlag,
} from "./type";
import { ResultFormatter } from "@ckb-lumos/rpc";

export const toFetchHeaderResult = (
  result: LightClientRPC.FetchHeaderResult
): FetchHeaderResult => {
  if (!result) return result;

  if (result.status === FetchFlag.Fetched) {
    return {
      status: result.status,
      data: ResultFormatter.toHeader(result.data),
    };
  }

  return result;
};

export const toFetchTransactionResult = (
  result: LightClientRPC.FetchTransactionResult
): FetchTransactionResult => {
  if (!result) return result;

  if (result.status === FetchFlag.Fetched) {
    return {
      status: result.status,
      data: ResultFormatter.toTransactionWithStatus(result.data),
    };
  }

  return result;
};

export const toLightClientScript = (
  lightClientScript: LightClientRPC.LightClientScript
): LightClientScript => {
  if (!lightClientScript) return lightClientScript;

  return {
    script: ResultFormatter.toScript(lightClientScript.script),
    blockNumber: lightClientScript.block_number,
    scriptType: lightClientScript.script_type,
  };
};
