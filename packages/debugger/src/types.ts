import { ScriptConfig } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import {
  CellDep,
  Hash,
  Header,
  HexString,
  Input,
  OutPoint,
  Output,
  Transaction,
} from "@ckb-lumos/base";
import { CKBDebugger } from "./executor";
import { LocaleCode } from "./context";

export interface ExecuteResult {
  code: number;
  cycles: number;
  message: string;
  debugMessage: string;
}

export interface DataLoader {
  getCellData(outPoint: OutPoint): HexString;

  getHeader(blockHash: Hash): Header;
}

export interface DebuggerData {
  mock_info: {
    inputs: { input: Input; output: Output; data: HexString; header?: Hash }[];
    cell_deps: {
      cell_dep: CellDep;
      output: Output;
      data: HexString;
      header?: Hash;
    }[];
    header_deps: Header[];
  };
  tx: Transaction;
}

export interface Executor {
  execute(
    tx: TransactionSkeletonType,
    options: {
      scriptHash: Hash;
      scriptGroupType: "lock" | "type";
    }
  ): Promise<ExecuteResult>;
}

export type TestContext<T extends LocaleCode> = {
  readonly scriptConfigs: Record<keyof T, ScriptConfig>;
  readonly executor: CKBDebugger;
};
