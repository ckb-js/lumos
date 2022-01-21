import JSBI from "jsbi";
import { Reader } from "../reader";
import { HexStringToBigInt, BigIntToHexString } from "../rpc";

export class RPCCollector {
  constructor(
    rpc,
    lockHash,
    {
      skipCellWithContent = true,
      loadData = false,
      loadBlockNumber = true,
    } = {}
  ) {
    this.rpc = rpc;
    this.lockHash = new Reader(lockHash).serializeJson();
    this.skipCellWithContent = skipCellWithContent;
    this.loadData = loadData;
    this.loadBlockNumber = loadBlockNumber;
  }

  async *collect() {
    const to = HexStringToBigInt(await this.rpc.get_tip_block_number());
    let currentFrom = JSBI.BigInt(0);
    while (JSBI.lessThanOrEqual(currentFrom, to)) {
      let currentTo = JSBI.add(currentFrom, JSBI.BigInt(100));
      if (JSBI.greaterThan(currentTo, to)) {
        currentTo = to;
      }
      const cells = await this.rpc.get_cells_by_lock_hash(
        this.lockHash,
        BigIntToHexString(currentFrom),
        BigIntToHexString(currentTo)
      );
      for (const cell of cells) {
        if (this.skipCellWithContent) {
          if (
            cell.type ||
            JSBI.greaterThan(
              HexStringToBigInt(cell.output_data_len),
              JSBI.BigInt(100)
            )
          ) {
            continue;
          }
        }
        let data = null;
        if (this.loadData) {
          const cellWithData = await this.rpc.get_live_cell(
            cell.out_point,
            true
          );
          data = cellWithData.cell.data.content;
        }
        let block_number = null;
        if (this.loadBlockNumber) {
          const header = await this.rpc.get_header(cell.block_hash);
          block_number = header.number;
        }
        yield {
          cellbase: cell.cellbase,
          cell_output: {
            capacity: cell.capacity,
            lock: cell.lock,
            type: cell.type,
          },
          out_point: cell.out_point,
          block_hash: cell.block_hash,
          data: data,
          output_data_len: cell.output_data_len,
          block_number,
        };
      }
      currentFrom = JSBI.add(currentTo, JSBI.BigInt(1));
    }
  }
}
