import {
  Cell,
  CellCollector,
  Hexadecimal,
  HexString,
  Indexer,
  QueryOptions,
  Script,
  Tip,
  OutPoint,
  HexNumber,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
import axios from "axios";
import { IndexerCollector } from "./collector";
export enum ScriptType {
  type = "type",
  lock = "lock",
}

export enum Order {
  asc = "asc",
  desc = "desc",
}

export interface CkbQueryOptions extends QueryOptions {
  outputDataLenRange?: HexadecimalRange;
  outputCapacityRange?: HexadecimalRange;
  bufferSize?: number;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
  script?: Script;
  output_data_len_range?: HexadecimalRange; //empty
  output_capacity_range?: HexadecimalRange; //empty
  block_range?: HexadecimalRange; //fromBlock-toBlock
}
export interface SearchKey {
  script: Script;
  script_type: ScriptType;
  filter?: SearchFilter;
}

export interface GetLiveCellsResult {
  last_cursor: string;
  objects: IndexerCell[];
}

export interface rpcResponse {
  status: number;
  data: rpcResponseData;
}

export interface rpcResponseData {
  result: string;
  error: string;
}

export interface IndexerCell {
  block_number: Hexadecimal;
  out_point: OutPoint;
  output: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
  output_data: HexString;
  tx_index: Hexadecimal;
}

export interface TerminatorResult {
  stop: boolean;
  push: boolean;
}

export declare type Terminator = (
  index: number,
  cell: Cell
) => TerminatorResult;

const DefaultTerminator: Terminator = () => {
  return { stop: false, push: true };
};

export type HexNum = string;
export type IOType = "input" | "output";
export type Bytes32 = string;
export type GetTransactionsResult = {
  block_number: HexNum;
  io_index: HexNum;
  io_type: IOType;
  tx_hash: Bytes32;
  tx_index: HexNum;
};
export interface GetTransactionsResults {
  last_cursor: string;
  objects: GetTransactionsResult[];
}

export interface GetCellsResults {
  lastCursor: string;
  objects: Cell[];
}

export interface AdditionalOptions {
  sizeLimit?: number;
  order?: Order;
  lastCursor?: string | undefined;
}

function defaultLogger(level: string, message: string) {
  console.log(`[${level}] ${message}`);
}

export class CkbIndexer implements Indexer {
  uri: string;

  constructor(public ckbIndexerUrl: string, public ckbRpcUrl: string) {
    this.uri = ckbRpcUrl;
  }

  private getCkbRpc(): RPC {
    return new RPC(this.ckbRpcUrl);
  }

  async tip(): Promise<Tip> {
    const res = await this.request("get_tip");
    return res as Tip;
  }

  asyncSleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  async waitForSync(blockDifference = 0): Promise<void> {
    const rpcTipNumber = parseInt(
      (await this.getCkbRpc().get_tip_header()).number,
      16
    );
    while (true) {
      const indexerTipNumber = parseInt((await this.tip()).block_number, 16);
      if (indexerTipNumber + blockDifference >= rpcTipNumber) {
        return;
      }
      await this.asyncSleep(1000);
    }
  }

  /*
   * Additional note:
   * Only accept lock and type parameters as `Script` type, along with `data` field in QueryOptions. Use it carefully!
   * */
  collector(queries: CkbQueryOptions): CellCollector {
    return new IndexerCollector(this, queries);
  }

  private async request(
    method: string,
    params?: any,
    ckbIndexerUrl: string = this.ckbIndexerUrl
  ): Promise<any> {
    const data = {
      id: 0,
      jsonrpc: "2.0",
      method,
      params,
    };
    const res: rpcResponse = await axios.post(ckbIndexerUrl, data);
    if (res.status !== 200) {
      throw new Error(`indexer request failed with HTTP code ${res.status}`);
    }
    if (res.data.error !== undefined) {
      throw new Error(
        `indexer request rpc failed with error: ${JSON.stringify(
          res.data.error
        )}`
      );
    }
    return res.data.result;
  }

  public async getCells(
    searchKey: SearchKey,
    terminator: Terminator = DefaultTerminator,
    additionalOptions: AdditionalOptions = {}
  ): Promise<GetCellsResults> {
    const infos: Cell[] = [];
    let cursor: string | undefined = additionalOptions.lastCursor;
    let sizeLimit = additionalOptions.sizeLimit || 100;
    let order = additionalOptions.order || Order.asc;
    const index = 0;
    while (true) {
      let params = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
      const res: GetLiveCellsResult = await this.request("get_cells", params);
      const liveCells = res.objects;
      cursor = res.last_cursor;
      for (const liveCell of liveCells) {
        const cell: Cell = {
          cell_output: liveCell.output,
          data: liveCell.output_data,
          out_point: liveCell.out_point,
          block_number: liveCell.block_number,
        };
        const { stop, push } = terminator(index, cell);
        if (push) {
          infos.push(cell);
        }
        if (stop) {
          return {
            objects: infos,
            lastCursor: cursor,
          };
        }
      }
      if (liveCells.length < sizeLimit) {
        break;
      }
    }
    return {
      objects: infos,
      lastCursor: cursor,
    };
  }

  running(): boolean {
    return true;
  }

  start(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to start the ckb-indexer manually"
    );
  }

  startForever(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to startForever the ckb-indexer manually"
    );
  }

  stop(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to stop the ckb-indexer manually"
    );
  }

  //  eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe(queries: CkbQueryOptions): NodeJS.EventEmitter {
    // TODO
    throw new Error("unimplemented");
  }

  subscribeMedianTime(): NodeJS.EventEmitter {
    // TODO
    throw new Error("unimplemented");
  }
}
