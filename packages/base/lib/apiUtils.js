const { BI } =  require( '@ckb-lumos/bi');

function transformCellInputCodecType(data)  {
  return {
    previous_output: transformOutPointCodecType(data.previous_output),
    since: BI.from(data.since)
  }
}
function transformOutPointCodecType(data) {
  return {
    tx_hash: data.tx_hash,
    index: BI.from(data.index).toNumber()
  }
}
function transformCellDepCodecType(data) {
  return {
    out_point: transformOutPointCodecType(data.out_point),
    dep_type: data.dep_type
  }
}
function transformCellOutputCodecType(data) {
  return {
    capacity: BI.from(data.capacity),
    lock: data.lock,
    type: data.type
  }
}
function transformRawTransactionCodecType(data) {
  return {
      version: BI.from(data.version).toNumber(),
      cell_deps: data.cell_deps.map(transformCellDepCodecType),
      header_deps: data.header_deps,
      inputs: data.inputs.map(transformCellInputCodecType),
      outputs: data.outputs.map(transformCellOutputCodecType),
      outputs_data: data.outputs_data,
  }
}
function transformTransactionCodecType(data) {
  return {
    raw: transformRawTransactionCodecType(data),
    witnesses: data.witnesses,
  }
}

module.exports = {
  transformCellInputCodecType,
  transformOutPointCodecType,
  transformCellDepCodecType,
  transformCellOutputCodecType,
  transformRawTransactionCodecType,
  transformTransactionCodecType,
}