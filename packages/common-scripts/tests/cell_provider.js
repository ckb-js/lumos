class CellCollector {
  constructor(options, cells) {
    this.options = options;
    this.cells = cells;
  }

  async *collect() {
    for (const cell of this.cells) {
      const optionLock = this.options.lock;
      if (optionLock) {
        const cellLock = cell.cell_output.lock;
        if (
          cellLock.code_hash === optionLock.code_hash &&
          cellLock.hash_type === optionLock.hash_type
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

class CellProvider {
  constructor(cells) {
    this.cells = cells;
  }

  collector(options) {
    return new CellCollector(options, this.cells);
  }
}

module.exports = {
  CellProvider,
};
