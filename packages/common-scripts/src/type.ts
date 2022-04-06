import {
  Cell,
  CellCollector,
  CellProvider,
  QueryOptions,
  Script,
} from "@ckb-lumos/base";
import { Options } from "@ckb-lumos/helpers";
import { FromInfo } from "./from_info";

export interface CellCollectorConstructor {
  new (
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config,
      queryOptions,
    }: Options & {
      queryOptions?: QueryOptions;
    }
  ): CellCollectorType;
}

export interface CellCollectorType extends CellCollector {
  readonly fromScript: Script;
  collect(): AsyncGenerator<Cell>;
}
