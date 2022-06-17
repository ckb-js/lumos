import { Config, ScriptConfig } from "@ckb-lumos/config-manager";
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

export interface ExecuteResult {
  code: number;
  cycles: number;
  message: string;
}

interface DebuggerScript extends ScriptConfig {
  HASH_TYPE: "data";
}

export interface DebuggerConfig extends Config {
  SCRIPTS: { [field: string]: DebuggerScript };
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

export interface Debugger {
  execute(
    tx: TransactionSkeletonType,
    options: {
      scriptHash: Hash;
      scriptGroupType: "lock" | "type";
    }
  ): Promise<ExecuteResult>;
}
