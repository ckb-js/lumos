class CellCollector {
  constructor(options, cells) {
    this.options = options;
    this.cells = cells;
  }

  async *collect() {
    for (const cell of this.cells) {
      yield cell;
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
