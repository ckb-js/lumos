const addon = require("../native");

const fs = require("fs");

class Chain {
  construct(configPath) {
    this.config = parseConfig(configPath);
    console.log(this.config);
    this.nativeChain = new addon.NativeChain(configPath);
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
