const { Reader } = require("ckb-js-toolkit");
const { JSBI } = require("./primitive");

function DenormalizeOutPoint(outPoint) {
  return {
    tx_hash: new Reader(outPoint.getTxHash().raw()).serializeJson(),
    index:
      "0x" +
      JSBI.BigInt(outPoint.getIndex().toLittleEndianUint32()).toString(16),
  };
}

function DenormalizeScript(script) {
  return {
    code_hash: new Reader(script.getCodeHash().raw()).serializeJson(),
    hash_type: script.getHashType() === 0 ? "data" : "type",
    args: new Reader(script.getArgs().raw()).serializeJson(),
  };
}

module.exports = {
  DenormalizeOutPoint,
  DenormalizeScript,
};
