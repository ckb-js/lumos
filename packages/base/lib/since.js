const { BI, isBIish } = require("@ckb-lumos/bi");
function parseSince(since) {
  const result = parseSinceCompatible(since);

  if (result.type === "epochNumber") return result;
  return { ...result, value: result.value.toBigInt() };
}

function parseSinceCompatible(since) {
  since = BI.from(since);
  const flag = since.shr(56);
  const metricFlag = flag.shr(5).and("0b11");
  let type;
  let value;
  if (metricFlag.eq(0b00)) {
    type = "blockNumber";
    value = since.and("0xFFFFFFFFFFFFFF");
  } else if (metricFlag.eq(0b01)) {
    type = "epochNumber";
    value = {
      length: since.shr(40).and(0xffff).toNumber(),
      index: since.shr(24).and(0xffff).toNumber(),
      number: since.and(0xffffff).toNumber(),
    };
  } else if (metricFlag.eq(0b10)) {
    type = "blockTimestamp";
    value = since.and("0xFFFFFFFFFFFFFF");
  } else {
    throw new Error("Invalid metric flag!");
  }

  return {
    relative: !flag.and("0x80").eq(0),
    type,
    value,
  };
}

function generateSince({ relative, type, value }) {
  let flag = BI.from(0);

  if (relative) {
    flag = flag.add(0b10000000);
  }

  if (type === "epochNumber") {
    flag = flag.add(0b00100000);
  } else if (type === "blockTimestamp") {
    flag = flag.add(0b01000000);
  }

  let v;
  if (isBIish(value)) {
    v = BI.from(value);
  } else if (typeof value === "object") {
    v = generateHeaderEpoch(value);
  } else {
    v = BI.from(value);
  }
  return _toHex(flag.shl(56).add(v));
}

function parseEpoch(epoch) {
  epoch = BI.from(epoch);
  return {
    length: epoch.shr(40).and(0xffff).toNumber(),
    index: epoch.shr(24).and(0xffff).toNumber(),
    number: epoch.and(0xffffff).toNumber(),
  };
}

function maximumAbsoluteEpochSince(...args) {
  const parsedArgs = args.map((arg) => parseAbsoluteEpochSince(arg));
  const maxNumber = Math.max(...parsedArgs.map((arg) => arg.number));
  const maxArgs = parsedArgs.filter((arg) => arg.number === maxNumber);
  let max = maxArgs[0];

  for (let i = 1; i < maxArgs.length; ++i) {
    const current = maxArgs[i];
    if (BI.from(current.index).mul(max.length).gte(BI.from(max.index).mul(current.length))) {
      max = current;
    }
  }

  return generateAbsoluteEpochSince(max);
}

function generateAbsoluteEpochSince({ length, index, number }) {
  return generateSince({
    relative: false,
    type: "epochNumber",
    value: { length, index, number },
  });
}

function generateHeaderEpoch({ length, index, number }) {
  return _toHex(BI.from(length).shl(40).add(BI.from(index).shl(24)).add(number));
}

function parseAbsoluteEpochSince(since) {
  const { relative, type, value } = parseSinceCompatible(since);

  if (!(relative === false && type === "epochNumber")) {
    throw new Error("Since format error!");
  }

  return value;
}

function validateAbsoluteEpochSince(since, tipHeaderEpoch) {
  const { value } = parseSinceCompatible(since);
  const headerEpochParams = parseEpoch(tipHeaderEpoch);
  return (
    BI.from(value.number).lt(headerEpochParams.number) ||
    (BI.from(value.number).eq(headerEpochParams.number) &&
      BI.from(value.index).mul(headerEpochParams.length).lte(BI.from(headerEpochParams.index).mul(value.length)))
  );
}

function validateSince(since, tipSinceValidationInfo, cellSinceValidationInfo) {
  const { relative, type, value } = parseSinceCompatible(since);

  if (!relative) {
    if (type === "epochNumber") {
      return validateAbsoluteEpochSince(since, tipSinceValidationInfo.epoch);
    }

    if (type === "blockNumber") {
      return BI.from(value).lte(tipSinceValidationInfo.blockNumber);
    }

    if (type === "blockTimestamp") {
      if (!tipSinceValidationInfo.median_timestamp) {
        throw new Error(`Must provide tip median_timestamp!`);
      }
      return BI.from(value).mul(1000).lte(tipSinceValidationInfo.median_timestamp);
    }
  } else {
    if (type === "epochNumber") {
      const tipHeaderEpoch = parseEpoch(tipSinceValidationInfo.epoch);
      const sinceHeaderEpoch = parseEpoch(cellSinceValidationInfo.epoch);
      const added = {
        number: BI.from(value.number).add(sinceHeaderEpoch.number),
        index: BI.from(value.index).mul(sinceHeaderEpoch.length).add(BI.from(sinceHeaderEpoch.index).mul(value.length)),
        length: BI.from(value.length).mul(sinceHeaderEpoch.length),
      };

      if (value.length === 0 && sinceHeaderEpoch.length !== 0) {
        added.index = sinceHeaderEpoch.index;
        added.length = sinceHeaderEpoch.length;
      } else if (sinceHeaderEpoch.length === 0 && value.length !== 0) {
        added.index = BI.from(value.index);
        added.length = BI.from(value.length);
      }

      if (!BI.from(added.length).eq(0) && BI.from(added.index).gte(added.length)) {
        added.number = added.index.div(added.length).add(added.number);
        added.index = added.index.mod(added.length);
      }

      return (
        BI.from(added.number).lt(tipHeaderEpoch.number) ||
        (BI.from(added.number).eq(tipHeaderEpoch.number) &&
          BI.from(added.index).mul(tipHeaderEpoch.length).lte(BI.from(tipHeaderEpoch.index).mul(added.length)))
      );
    }

    if (type === "blockNumber") {
      return BI.from(value).add(cellSinceValidationInfo.blockNumber).lte(tipSinceValidationInfo.blockNumber);
    }

    if (type === "blockTimestamp") {
      if (!tipSinceValidationInfo.median_timestamp || !cellSinceValidationInfo.median_timestamp) {
        throw new Error(`Must provide median_timestamp!`);
      }
      return BI.from(value)
        .mul(1000)
        .add(cellSinceValidationInfo.median_timestamp)
        .lte(tipSinceValidationInfo.median_timestamp);
    }
  }
}

function _toHex(num) {
  return "0x" + num.toString(16);
}

module.exports = {
  parseSince,
  parseSinceCompatible,
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  validateAbsoluteEpochSince,
  validateSince,
  generateSince,
  generateHeaderEpoch,
};
