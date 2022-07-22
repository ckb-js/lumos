import { ScriptConfig } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import {
  Hash,
  Header,
  HexString,
  OutPoint,
  Transaction,
} from "@ckb-lumos/base";
import { CKBDebugger } from "./executor";
import { LocaleCode } from "./context";
import { RPC } from "@ckb-lumos/rpc/lib/types/rpc";

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
    inputs: {
      input: RPC.CellInput;
      output: RPC.CellOutput;
      data: HexString;
      header?: Hash;
    }[];
    cell_deps: {
      cell_dep: RPC.CellDep;
      output: RPC.CellOutput;
      data: HexString;
      header?: Hash;
    }[];
    header_deps: RPC.Header[];
  };
  tx: RPC.RawTransaction;
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
