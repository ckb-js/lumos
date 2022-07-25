import { HexString, HexNumber, Script } from "@ckb-lumos/base";

export namespace IndexerType {
  export type Tip = {
    blockHash: HexNumber;
    blockNumber: HexString;
  };
  export type CellOutput = {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
}
