import { CKBComponents } from "@ckb-lumos/rpc/types/api";
import { RPC } from "@ckb-lumos/rpc/types/rpc";

export enum FetchFlag {
  Fetched = "fetched",
  Fetching = "fetching",
  Added = "added",
  NotFound = "not_found",
}

export type FetchResult<R> =
  | { status: FetchFlag.Fetched; data: R }
  | { status: FetchFlag.Fetching; firstSent: string }
  | { status: FetchFlag.Added; timestamp: CKBComponents.Timestamp }
  | { status: FetchFlag.NotFound };

export type FetchHeaderResult = FetchResult<CKBComponents.BlockHeader>;
export type FetchTransactionResult =
  FetchResult<CKBComponents.TransactionWithStatus>;

export type SetScriptCommand = "all" | "partial" | "delete";

export type LightClientScript = {
  script: CKBComponents.Script;
  blockNumber: CKBComponents.UInt64;
  scriptType: CKBComponents.ScriptType;
};

/* eslint-disable  @typescript-eslint/no-namespace */
export namespace LightClientRPC {
  export type FetchHeaderResult = FetchResult<RPC.Header>;
  export type FetchTransactionResult = FetchResult<RPC.TransactionWithStatus>;

  export type LightClientScript = {
    script: RPC.Script;
    block_number: RPC.Uint64;
    script_type: RPC.ScriptType;
  };
}
