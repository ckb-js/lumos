const { BI } = require("@ckb-lumos/bi");

function transformCellInputCodecType(data) {
  return {
    previousOutput: transformOutPointCodecType(data.previousOutput),
    since: BI.from(data.since),
  };
}
function transformOutPointCodecType(data) {
  return {
    txHash: data.txHash,
    index: BI.from(data.index).toNumber(),
  };
}
function transformCellDepCodecType(data) {
  return {
    outPoint: transformOutPointCodecType(data.outPoint),
    depType: data.depType,
  };
}
function transformCellOutputCodecType(data) {
  return {
    capacity: BI.from(data.capacity),
    lock: data.lock,
    type: data.type,
  };
}
function transformRawTransactionCodecType(data) {
  return {
    version: BI.from(data.version).toNumber(),
    cellDeps: data.cellDeps.map(transformCellDepCodecType),
    headerDeps: data.headerDeps,
    inputs: data.inputs.map(transformCellInputCodecType),
    outputs: data.outputs.map(transformCellOutputCodecType),
    outputsData: data.outputsData,
  };
}
function transformTransactionCodecType(data) {
  return {
    raw: transformRawTransactionCodecType(data),
    witnesses: data.witnesses,
  };
}

module.exports = {
  transformCellInputCodecType,
  transformOutPointCodecType,
  transformCellDepCodecType,
  transformCellOutputCodecType,
  transformRawTransactionCodecType,
  transformTransactionCodecType,
};
