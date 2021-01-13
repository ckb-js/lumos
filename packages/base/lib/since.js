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
      length: Number((since >> BigInt(40)) & BigInt(0xffff)),
      index: Number((since >> BigInt(24)) & BigInt(0xffff)),
      number: Number(since & BigInt(0xffffff)),
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
    flag += BigInt(0b10000000);
  }
  if (type === "epochNumber") {
    flag += BigInt(0b00100000);
  } else if (type === "blockTimestamp") {
    flag += BigInt(0b01000000);
  }

  let v;
  if (typeof value === "object") {
    v = BigInt(generateHeaderEpoch(value));
  } else {
    v = BigInt(value);
  }

  // TODO: check v is valid

  return _toHex((flag << BigInt(56)) + v);
}

function parseEpoch(epoch) {
  epoch = BigInt(epoch);
  return {
    length: Number((epoch >> BigInt(40)) & BigInt(0xffff)),
    index: Number((epoch >> BigInt(24)) & BigInt(0xffff)),
    number: Number(epoch & BigInt(0xffffff)),
  };
}

function maximumAbsoluteEpochSince(...args) {
  const parsedArgs = args.map((arg) => parseAbsoluteEpochSince(arg));
  const maxNumber = Math.max(...parsedArgs.map((arg) => arg.number));
  const maxArgs = parsedArgs.filter((arg) => arg.number === maxNumber);

  let max = maxArgs[0];
  for (let i = 1; i < maxArgs.length; ++i) {
    const current = maxArgs[i];
    if (
      BigInt(current.index) * BigInt(max.length) >=
      BigInt(max.index) * BigInt(current.length)
    ) {
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
  return _toHex(
    (BigInt(length) << BigInt(40)) +
      (BigInt(index) << BigInt(24)) +
      BigInt(number)
  );
}

function parseAbsoluteEpochSince(since) {
  const { relative, type, value } = parseSince(since);
  if (!(relative === false && type === "epochNumber")) {
    throw new Error("Since format error!");
  }
  return value;
}

function validateAbsoluteEpochSince(since, tipHeaderEpoch) {
  const { value } = parseSince(since);
  const headerEpochParams = parseEpoch(BigInt(tipHeaderEpoch));

  return (
    value.number < headerEpochParams.number ||
    (value.number === headerEpochParams.number &&
      BigInt(value.index) * BigInt(headerEpochParams.length) <=
        BigInt(headerEpochParams.index) * BigInt(value.length))
  );
}

function validateSince(
  since,
  tipHeader,
  sinceHeader,
  tipMedianTimestamp,
  cellMedianTimestamp
) {
  const { relative, type, value } = parseSince(since);
  if (!relative) {
    if (type === "epochNumber") {
      return validateAbsoluteEpochSince(since, tipHeader.epoch);
    }
    if (type === "blockNumber") {
      return value <= BigInt(tipHeader.number);
    }
    if (type === "blockTimestamp") {
      if (!tipMedianTimestamp) {
        throw new Error(`Must provide tipMedianTimestamp!`);
      }

      return value * 1000n <= BigInt(tipMedianTimestamp);
    }
  } else {
    if (type === "epochNumber") {
      const tipHeaderEpoch = parseEpoch(BigInt(tipHeader.epoch));
      const sinceHeaderEpoch = parseEpoch(BigInt(sinceHeader.epoch));
      const added = {
        number: BigInt(value.number + sinceHeaderEpoch.number),
        index:
          BigInt(value.index) * BigInt(sinceHeaderEpoch.length) +
          BigInt(sinceHeaderEpoch.index) * BigInt(value.length),
        length: BigInt(value.length) * BigInt(sinceHeaderEpoch.length),
      };
      if (value.length === 0 && sinceHeaderEpoch.length !== 0) {
        added.index = BigInt(sinceHeaderEpoch.index);
        added.length = BigInt(sinceHeaderEpoch.length);
      } else if (sinceHeaderEpoch.length === 0 && value.length !== 0) {
        added.index = BigInt(value.index);
        added.length = BigInt(value.length);
      }
      if (added.length && added.index >= added.length) {
        added.number += added.index / added.length;
        added.index = added.index % added.length;
      }

      return (
        added.number < BigInt(tipHeaderEpoch.number) ||
        (added.number === BigInt(tipHeaderEpoch.number) &&
          added.index * BigInt(tipHeaderEpoch.length) <=
            BigInt(tipHeaderEpoch.index) * added.length)
      );
    }
    if (type === "blockNumber") {
      return value + BigInt(sinceHeader.number) <= BigInt(tipHeader.number);
    }
    if (type === "blockTimestamp") {
      if (!tipMedianTimestamp || !cellMedianTimestamp) {
        throw new Error(
          `Must provide tipMediamTimestamp and cellMedianTimestamp!`
        );
      }

      return (
        value * 1000n + BigInt(cellMedianTimestamp) <=
        BigInt(tipMedianTimestamp)
      );
    }
  }
}

function _toHex(num) {
  return "0x" + num.toString(16);
}

module.exports = {
  parseSince,
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  validateAbsoluteEpochSince,
  validateSince,
  generateSince,
  generateHeaderEpoch,
};
