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
  const hashType = script.getHashType();

  return {
    code_hash: new Reader(script.getCodeHash().raw()).serializeJson(),
    hash_type: (() => {
      if (hashType === 0) return "data";
      if (hashType === 1) return "type";
      if (hashType === 2) return "data1";
    })(),
    args: new Reader(script.getArgs().raw()).serializeJson(),
  };
}

module.exports = {
  DenormalizeOutPoint,
  DenormalizeScript,
};
