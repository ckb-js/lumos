import { Cell, Script } from "@ckb-lumos/base";

interface Options {
  lock?: Script;
}

class CellCollector {
  private options: Options;
  private cells: Cell[];

  constructor(options: Options, cells: Cell[]) {
    this.options = options;
    this.cells = cells;
  }

  async *collect(): AsyncGenerator<Cell> {
    for (const cell of this.cells) {
      const optionLock = this.options.lock;
      if (optionLock) {
        const cellLock = cell.cell_output.lock;
        if (
          cellLock.code_hash === optionLock.code_hash &&
          cellLock.hash_type === optionLock.hash_type &&
          cellLock.args === optionLock.args
        ) {
          yield cell;
        } else {
          continue;
        }
      } else {
        yield cell;
      }
    }
  }
}

export class CellProvider {
  private cells: Cell[];

  constructor(cells: Cell[]) {
    this.cells = cells;
  }

  collector(options: Options): CellCollector {
    return new CellCollector(options, this.cells);
  }
}
