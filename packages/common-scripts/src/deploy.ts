// TODO uncomment me when implemented
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CellProvider, OutPoint, Script } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { RPC } from "@ckb-lumos/rpc";

function unimplemented(): never {
  throw new Error("unimplemented");
}

interface DeployOptions {
  cellProvider: CellProvider;
  scriptBinary: Uint8Array;
  outputScriptLock: Script;
  config?: Config;
}

export function generateDeployWithDataTx(
  options: DeployOptions
): Promise<TransactionSkeletonType> {
  unimplemented();
}

export function generateDeployWithTypeIdTx(
  options: DeployOptions
): Promise<TransactionSkeletonType> {
  unimplemented();
}

interface UpgradeOptions extends DeployOptions {
  typeId: Script;
}

export function generateUpgradeTypeIdDataTx(
  options: UpgradeOptions
): Promise<TransactionSkeletonType> {
  unimplemented();
}

export function compareScriptBinaryWithOnChainData(
  scriptBinary: Uint8Array,
  outPoint: OutPoint,
  rpc: RPC
): Promise<boolean> {
  unimplemented();
}
