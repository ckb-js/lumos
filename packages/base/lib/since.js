const { JSBI, maybeJSBI } = require("./primitive");
const { isBIish, toJSBI, BI } = require("@ckb-lumos/bi");

function parseSince(since) {
  const result = parseSinceCompatible(since);

  if (result.type === "epochNumber") return result;
  return { ...result, value: result.value.toBigInt() };
}

function parseSinceCompatible(since) {
  since = JSBI.BigInt(since);
  const flag = JSBI.signedRightShift(since, JSBI.BigInt(56));
  const metricFlag = JSBI.bitwiseAnd(
    JSBI.signedRightShift(flag, JSBI.BigInt(5)),
    JSBI.BigInt("0b11")
  );
  let type;
  let value;

  if (JSBI.equal(metricFlag, JSBI.BigInt(0b00))) {
    type = "blockNumber";
    value = BI.from(JSBI.bitwiseAnd(since, JSBI.BigInt("0xFFFFFFFFFFFFFF")));
  } else if (JSBI.equal(metricFlag, JSBI.BigInt(0b01))) {
    type = "epochNumber";
    value = {
      length: JSBI.toNumber(
        JSBI.bitwiseAnd(
          JSBI.signedRightShift(since, JSBI.BigInt(40)),
          JSBI.BigInt(0xffff)
        )
      ),
      index: JSBI.toNumber(
        JSBI.bitwiseAnd(
          JSBI.signedRightShift(since, JSBI.BigInt(24)),
          JSBI.BigInt(0xffff)
        )
      ),
      number: JSBI.toNumber(JSBI.bitwiseAnd(since, JSBI.BigInt(0xffffff))),
    };
  } else if (JSBI.equal(metricFlag, JSBI.BigInt(0b10))) {
    type = "blockTimestamp";
    value = BI.from(JSBI.bitwiseAnd(since, JSBI.BigInt("0xFFFFFFFFFFFFFF")));
  } else {
    throw new Error("Invalid metric flag!");
  }

  return {
    relative: JSBI.notEqual(
      JSBI.bitwiseAnd(flag, JSBI.BigInt("0x80")),
      JSBI.BigInt(0)
    ),
    type,
    value,
  };
}

function generateSince({ relative, type, value }) {
  let flag = JSBI.BigInt(0);

  if (relative) {
    flag = JSBI.add(flag, JSBI.BigInt(0b10000000));
  }

  if (type === "epochNumber") {
    flag = JSBI.add(flag, JSBI.BigInt(0b00100000));
  } else if (type === "blockTimestamp") {
    flag = JSBI.add(flag, JSBI.BigInt(0b01000000));
  }

  let v;
  if (isBIish(value)) {
    v = toJSBI(value);
  } else if (typeof value === "object") {
    v = JSBI.BigInt(generateHeaderEpoch(value));
  } else {
    v = toJSBI(value);
  } // TODO: check v is valid

  return _toHex(JSBI.add(JSBI.leftShift(flag, JSBI.BigInt(56)), v));
}

function parseEpoch(epoch) {
  epoch = JSBI.BigInt(epoch);
  return {
    length: JSBI.toNumber(
      JSBI.bitwiseAnd(
        JSBI.signedRightShift(epoch, JSBI.BigInt(40)),
        JSBI.BigInt(0xffff)
      )
    ),
    index: JSBI.toNumber(
      JSBI.bitwiseAnd(
        JSBI.signedRightShift(epoch, JSBI.BigInt(24)),
        JSBI.BigInt(0xffff)
      )
    ),
    number: JSBI.toNumber(JSBI.bitwiseAnd(epoch, JSBI.BigInt(0xffffff))),
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
      JSBI.greaterThanOrEqual(
        JSBI.multiply(JSBI.BigInt(current.index), JSBI.BigInt(max.length)),
        JSBI.multiply(JSBI.BigInt(max.index), JSBI.BigInt(current.length))
      )
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
    JSBI.add(
      JSBI.add(
        JSBI.leftShift(JSBI.BigInt(length), JSBI.BigInt(40)),
        JSBI.leftShift(JSBI.BigInt(index), JSBI.BigInt(24))
      ),
      JSBI.BigInt(number)
    )
  );
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
  const headerEpochParams = parseEpoch(JSBI.BigInt(tipHeaderEpoch));
  return (
    maybeJSBI.lessThan(value.number, headerEpochParams.number) ||
    (maybeJSBI.equal(value.number, headerEpochParams.number) &&
      JSBI.lessThanOrEqual(
        JSBI.multiply(
          JSBI.BigInt(value.index),
          JSBI.BigInt(headerEpochParams.length)
        ),
        JSBI.multiply(
          JSBI.BigInt(headerEpochParams.index),
          JSBI.BigInt(value.length)
        )
      ))
  );
}

function validateSince(since, tipSinceValidationInfo, cellSinceValidationInfo) {
  const { relative, type, value } = parseSinceCompatible(since);

  if (!relative) {
    if (type === "epochNumber") {
      return validateAbsoluteEpochSince(since, tipSinceValidationInfo.epoch);
    }

    if (type === "blockNumber") {
      return JSBI.lessThanOrEqual(
        toJSBI(value),
        JSBI.BigInt(tipSinceValidationInfo.block_number)
      );
    }

    if (type === "blockTimestamp") {
      if (!tipSinceValidationInfo.median_timestamp) {
        throw new Error(`Must provide tip median_timestamp!`);
      }

      return JSBI.lessThanOrEqual(
        JSBI.multiply(toJSBI(value), JSBI.BigInt(1000)),
        JSBI.BigInt(tipSinceValidationInfo.median_timestamp)
      );
    }
  } else {
    if (type === "epochNumber") {
      const tipHeaderEpoch = parseEpoch(
        JSBI.BigInt(tipSinceValidationInfo.epoch)
      );
      const sinceHeaderEpoch = parseEpoch(
        JSBI.BigInt(cellSinceValidationInfo.epoch)
      );
      const added = {
        number: JSBI.BigInt(
          maybeJSBI.add(value.number, sinceHeaderEpoch.number)
        ),
        index: JSBI.add(
          JSBI.multiply(
            JSBI.BigInt(value.index),
            JSBI.BigInt(sinceHeaderEpoch.length)
          ),
          JSBI.multiply(
            JSBI.BigInt(sinceHeaderEpoch.index),
            JSBI.BigInt(value.length)
          )
        ),
        length: JSBI.multiply(
          JSBI.BigInt(value.length),
          JSBI.BigInt(sinceHeaderEpoch.length)
        ),
      };

      if (value.length === 0 && sinceHeaderEpoch.length !== 0) {
        added.index = JSBI.BigInt(sinceHeaderEpoch.index);
        added.length = JSBI.BigInt(sinceHeaderEpoch.length);
      } else if (sinceHeaderEpoch.length === 0 && value.length !== 0) {
        added.index = JSBI.BigInt(value.index);
        added.length = JSBI.BigInt(value.length);
      }

      if (
        maybeJSBI.notEqual(added.length, JSBI.BigInt(0)) &&
        maybeJSBI.greaterThanOrEqual(added.index, added.length)
      ) {
        let _x, _y;

        (_x = added),
          (_y = "number"),
          (_x[_y] = maybeJSBI.add(
            _x[_y],
            maybeJSBI.divide(added.index, added.length)
          ));
        added.index = maybeJSBI.remainder(added.index, added.length);
      }

      return (
        JSBI.lessThan(added.number, JSBI.BigInt(tipHeaderEpoch.number)) ||
        (JSBI.equal(added.number, JSBI.BigInt(tipHeaderEpoch.number)) &&
          JSBI.lessThanOrEqual(
            JSBI.multiply(added.index, JSBI.BigInt(tipHeaderEpoch.length)),
            JSBI.multiply(JSBI.BigInt(tipHeaderEpoch.index), added.length)
          ))
      );
    }

    if (type === "blockNumber") {
      return JSBI.lessThanOrEqual(
        JSBI.add(
          toJSBI(value),
          JSBI.BigInt(cellSinceValidationInfo.block_number)
        ),
        JSBI.BigInt(tipSinceValidationInfo.block_number)
      );
    }

    if (type === "blockTimestamp") {
      if (
        !tipSinceValidationInfo.median_timestamp ||
        !cellSinceValidationInfo.median_timestamp
      ) {
        throw new Error(`Must provide median_timestamp!`);
      }

      return JSBI.lessThanOrEqual(
        JSBI.add(
          JSBI.multiply(toJSBI(value), JSBI.BigInt(1000)),
          JSBI.BigInt(cellSinceValidationInfo.median_timestamp)
        ),
        JSBI.BigInt(tipSinceValidationInfo.median_timestamp)
      );
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
