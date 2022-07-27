import { Cell, CellCollector, CellProvider, QueryOptions, Script, Header } from "@ckb-lumos/base";
import { Options } from "@ckb-lumos/helpers";
import RPC from "@ckb-lumos/rpc";
import { FromInfo } from "./from_info";

export interface CellCollectorConstructor {
  new (
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config,
      queryOptions,
      tipHeader,
      NodeRPC,
    }: Options & {
      queryOptions?: QueryOptions;
      tipHeader?: Header;
      NodeRPC?: typeof RPC;
    }
  ): CellCollectorType;
}

export interface CellCollectorType extends CellCollector {
  readonly fromScript: Script;
  collect(): AsyncGenerator<Cell>;
}
