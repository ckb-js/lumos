function parseSince(since) {
  since = BigInt(since);
  const flag = since >> BigInt(56);
  const metricFlag = (flag >> BigInt(5)) & BigInt("0b11");
  let type;
  let value;
  if (metricFlag === BigInt(0b00)) {
    type = "blockNumber";
    value = since & BigInt("0xFFFFFFFFFFFFFF");
  } else if (metricFlag === BigInt(0b01)) {
    type = "epochNumber";
    value = {
      length: (since >> BigInt(40)) & BigInt(0xffff),
      index: (since >> BigInt(24)) & BigInt(0xffff),
      number: since & BigInt(0xffffff),
    };
  } else if (metricFlag === BigInt(0b10)) {
    type = "blockTimestamp";
    value = since & BigInt("0xFFFFFFFFFFFFFF");
  } else {
    throw new Error("Invalid metric flag!");
  }

  return {
    relative: (flag & BigInt("0x80")) !== BigInt(0),
    type,
    value,
  };
}

function generateSince({ relative, type, value }) {
  let flag = BigInt(0);
  if (relative) {
    flag = flag << BigInt(0b10000000);
  }
  if (type === "epochNumber") {
    flag = flag << BigInt(0b00100000);
  } else if (type === "blockTimestamp") {
    flag = flag << BigInt(0b01000000);
  }

  let v;
  if (typeof value === "object") {
    v = generateHeaderEpoch(value);
  } else {
    v = BigInt(value);
  }

  // TODO: check v is valid

  return flag + v;
}

function parseEpoch(epoch) {
  epoch = BigInt(epoch);
  return {
    length: (epoch >> BigInt(40)) & BigInt(0xffff),
    index: (epoch >> BigInt(24)) & BigInt(0xffff),
    number: epoch & BigInt(0xffffff),
  };
}

function largerAbsoluteEpochSince(one, another) {
  const parsedOne = parseAbsoluteEpochSince(one);
  const parsedAnother = parseAbsoluteEpochSince(another);

  if (
    parsedOne.number > parsedAnother.number ||
    (parsedOne.number === parsedAnother.number &&
      parsedOne.index * parsedAnother.length >=
        parsedAnother.index * parsedOne.length)
  ) {
    return one;
  }
  return another;
}

function generateAbsoluteEpochSince({ length, index, number }) {
  return generateSince({
    relative: false,
    type: "epochNumber",
    value: { length, index, number },
  });
}

function generateHeaderEpoch({ length, index, number }) {
  return (length << BigInt(40)) + (index << BigInt(24)) + number;
}

function parseAbsoluteEpochSince(since) {
  const { relative, type, value } = parseSince(since);
  if (!(relative === false && type === "epochNumber")) {
    throw new Error("Since format error!");
  }
  return value;
}

function checkAbsoluteEpochSinceValid(since, tipHeaderEpoch) {
  const { value } = parseSince(since);
  const headerEpochParams = parseEpoch(BigInt(tipHeaderEpoch));

  return (
    value.number < headerEpochParams.number ||
    (value.number === headerEpochParams.number &&
      value.index * headerEpochParams.length <=
        headerEpochParams.index * value.length)
  );
}

function checkSinceValid(since, tipHeader, sinceHeader) {
  const { relative, type, value } = parseSince(since);
  if (!relative) {
    if (type === "epochNumber") {
      return checkAbsoluteEpochSinceValid(since, tipHeader.epoch);
    }
    if (type === "blockNumber") {
      return value <= BigInt(tipHeader.number);
    }
    if (type === "blockTimestamp") {
      return value <= BigInt(tipHeader.timestamp);
    }
  } else {
    if (type === "epochNumber") {
      const tipHeaderEpoch = parseEpoch(BigInt(tipHeader.epoch));
      const sinceHeaderEpoch = parseEpoch(BigInt(sinceHeader.epoch));
      const added = {
        number: value.number + sinceHeaderEpoch.number,
        index:
          value.index * sinceHeaderEpoch.length +
          sinceHeaderEpoch.index +
          value.length,
        length: value.length * sinceHeaderEpoch.length,
      };
      if (added.length && added.index >= added.length) {
        added.number += index / length;
        added.index = index % length;
      }

      return (
        added.number < tipHeaderEpoch.number ||
        (added.number === tipHeaderEpoch.number &&
          added.index * tipHeaderEpoch.length <=
            tipHeaderEpoch.index * added.length)
      );
    }
    if (type === "blockNumber") {
      return value + BigInt(sinceHeader.number) <= BigInt(tipHeader.number);
    }
    if (type === "blockTimestamp") {
      return (
        value + BigInt(sinceHeader.timestamp) <= BigInt(tipHeader.timestamp)
      );
    }
  }
}

module.exports = {
  parseSince,
  parseEpoch,
  largerAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  checkAbsoluteEpochSinceValid,
  checkSinceValid,
  generateSince,
};
