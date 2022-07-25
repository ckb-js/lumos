import { HexString, HexNumber, Hash } from "@ckb-lumos/base";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RPCType {
  export type Tip = {
    block_hash: HexNumber;
    block_number: HexString;
  };
  export type Script = {
    code_hash: HexString;
    hash_type: "type" | "data" | "data1";
    args: HexString;
  };
  export interface OutPoint {
    tx_hash: Hash;
    index: HexNumber;
  }
  export type CellOutput = {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
}
