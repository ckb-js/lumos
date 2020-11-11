const addon = require("../native");

const fs = require("fs");

class Chain {
  construct(configPath) {
    this.config = parseConfig(configPath);
    console.log(this.config);
    this.nativeChain = new addon.NativeChain(configPath);
  }

  build_genesis() {
    const l2BlockSlice = this.nativeChain.build_genesis();
    const  l2Block = l2BlockSlice;
    return l2Block;
  }

  // sync chain from layer1
  sync() {}

  produceBlock() {}

  processBlock() {}

  start() {
        return this.nativeChain.start();
  }

  stop() {}
}

function parseConfig(configPath) {
  let rawData = fs.readFileSync(configPath);
  return JSON.parse(rawData);
}

module.exports = { Chain };
