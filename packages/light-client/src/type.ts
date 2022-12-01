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

export interface LightClientTransactionList<Grouped extends boolean = false> {
  lastCursor: string | undefined;
  objects: LightClientTransaction<Grouped>[];
}

export type LightClientTransaction<Goruped extends boolean = false> =
  Goruped extends true
    ? GroupedLightClientTransaction
    : UngroupedLightClientTransaction;

export type HexNum = string;
export type IOType = "input" | "output" | "both";

export type UngroupedLightClientTransaction = {
  transaction: Transaction;
  blockNumber: HexNum;
  ioIndex: HexNum;
  ioType: IOType;
  txIndex: HexNum;
};

export type GroupedLightClientTransaction = {
  transaction: Transaction;
  blockNumber: HexNum;
  txIndex: HexNum;
  cells: Array<[IOType, HexNum]>;
};

export type LightClientScript = {
  script: Script;
  blockNumber: HexNumber;
  scriptType: ScriptType;
};
