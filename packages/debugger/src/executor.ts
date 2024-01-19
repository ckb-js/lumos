import { DataLoader, ExecuteResult, Executor } from "./types";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { spawnSync } from "child_process";
import { Hash } from "@ckb-lumos/base";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseDebuggerData, parseDebuggerMessage } from "./parse";

interface DebuggerOptions {
  readonly loader: DataLoader;
  readonly debuggerPath?: string;
}

type Options = {
  /**
   * script hash to execute
   * @example
   * computeScriptHash(inputs[0].lock)
   */
  scriptHash: Hash;
  /**
   * script group type to execute
   */
  scriptGroupType: "lock" | "type";
};

// TODO maybe we can compile the ckb-debugger to a wasm or a node module
export class CKBDebugger implements Executor {
  loader: DataLoader;
  debuggerPath: string;

  constructor(payload: DebuggerOptions) {
    this.loader = payload.loader;
    const debuggerPath = payload.debuggerPath || process.env.CKB_DEBUGGER_PATH;

    if (!debuggerPath) {
      throw new Error(
        "Cannot find ckb-debugger, please set CKB_DEBUGGER_PATH env"
      );
    }

    this.debuggerPath = debuggerPath;
  }

  /**
   * save tx skeleton to tmp file and return the path
   * @param txSkeleton
   * @private
   */
  private saveTmpTxFile(txSkeleton: TransactionSkeletonType): string {
    const debuggerData = parseDebuggerData(txSkeleton, this.loader);

    // TODO replace with random tmp file name to avoid conflict
    const tmpTxPath = path.join(os.tmpdir(), "ckb_debugger_tx.json");
    fs.writeFileSync(tmpTxPath, JSON.stringify(debuggerData));

    return tmpTxPath;
  }

  async execute(
    txSkeleton: TransactionSkeletonType,
    options: Options
  ): Promise<ExecuteResult> {
    const tmpTxPath = this.saveTmpTxFile(txSkeleton);

    const buf = spawnSync(
      this.debuggerPath,
      [
        "--tx-file",
        tmpTxPath,
        "--script-hash",
        options.scriptHash,
        "--script-group-type",
        options.scriptGroupType,
      ],
      {
        env: { RUST_LOG: "debug" },
      }
    );

    return parseDebuggerMessage(
      buf.stdout.toString("utf-8"),
      buf.stderr.toString("utf-8")
    );
  }
}
