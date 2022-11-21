export type ScriptType = "type" | "lock";

import { HexNumber, Script, Transaction, Header } from "@ckb-lumos/base";

export enum FetchFlag {
  Fetched = "fetched",
  Fetching = "fetching",
  Added = "added",
  NotFound = "not_found",
}

export type FetchHeaderResult =
  | { status: FetchFlag.Fetched; data: Header }
  | { status: FetchFlag.Fetching; firstSent: string }
  | { status: FetchFlag.Added; timestamp: string }
  | { status: FetchFlag.NotFound };

export type TransactionWithHeader = {
  transaction: Transaction;
  header: Header;
};

export type FetchTransactionResult =
  | { status: FetchFlag.Fetched; data: TransactionWithHeader }
  | { status: FetchFlag.Fetching; firstSent: string }
  | { status: FetchFlag.Added; timestamp: string }
  | { status: FetchFlag.NotFound };

export type LightClientScript = {
  script: Script;
  blockNumber: HexNumber;
  scriptType: ScriptType;
};
