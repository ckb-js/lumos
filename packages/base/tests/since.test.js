const test = require("ava");
const { BI } = require("@ckb-lumos/bi");

const { since, utils } = require("../src");

const {
  parseSinceCompatible,
  generateSince,
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  validateAbsoluteEpochSince,
  validateSince,
  generateHeaderEpoch,
} = since;

const fixtrues = [
  {
    since: "0x3039",
    parsed: {
      relative: false,
      type: "blockNumber",
      value: BI.from(12345),
    },
  },
  {
    since: "0x400000005e83d980",
    parsed: {
      relative: false,
      type: "blockTimestamp",
      value: BI.from(+new Date("2020-04-01")).div(1000),
    },
  },
  {
    since: "0x2000000000000400",
    parsed: {
      relative: false,
      type: "epochNumber",
      value: {
        number: 1024,
        index: 0,
        length: 0,
      },
    },
  },
  {
    since: "0x8000000000000064",
    parsed: {
      relative: true,
      type: "blockNumber",
      value: BI.from(100),
    },
  },
  {
    since: "0xc000000000127500",
    parsed: {
      relative: true,
      type: "blockTimestamp",
      value: BI.from(14 * 24 * 60 * 60),
    },
  },
  {
    since: "0xa000000000000018",
    parsed: {
      relative: true,
      type: "epochNumber",
      value: {
        number: 24,
        length: 0,
        index: 0,
      },
    },
  },
];

const epochFixtrue = {
  epoch: "0x" + BI.from("1979121332649985").toString(16),
  parsed: {
    length: 1800,
    index: 24,
    number: 1,
  },
};
test.before(() => {
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("parsedSince", (t) => {
  fixtrues.forEach((v) => {
    const parsed = parseSinceCompatible(v.since);
    t.true(utils.isDeepEqual(parsed, v.parsed));
  });
});

test("generateSince", (t) => {
  fixtrues.forEach((v) => {
    const since = generateSince(v.parsed);
    t.is(since, v.since);
  });
});

test("parseEpoch", (t) => {
  const result = parseEpoch(epochFixtrue.epoch);
  t.deepEqual(result, epochFixtrue.parsed);
});

test("generateHeaderEpoch", (t) => {
  const result = generateHeaderEpoch(epochFixtrue.parsed);
  t.is(result, epochFixtrue.epoch);
});

test("generateAbsoluteEpochSince", (t) => {
  fixtrues
    .filter(
      (f) => f.parsed.type === "epochNumber" && f.parsed.relative === false
    )
    .map((f) => {
      const since = generateAbsoluteEpochSince(f.parsed.value);
      t.deepEqual(since, f.since);
    });
});

test("parseAbsoluteEpochSince", (t) => {
  fixtrues.map((f) => {
    if (f.parsed.relative === false && f.parsed.type === "epochNumber") {
      t.deepEqual(parseAbsoluteEpochSince(f.since), f.parsed.value);
    } else {
      t.throws(() => parseAbsoluteEpochSince(f.since));
    }
  });
});

test("validateSince, absolute blockNumber", (t) => {
  const since = generateSince({
    relative: false,
    type: "blockNumber",
    value: BI.from("12345").toString(),
  });

  const cellSinceValidationInfo = {
    number: "0x" + BI.from(11).toString(16),
  };

  t.true(
    validateSince(
      since,
      {
        blockNumber: "0x" + BI.from(12345).toString(16),
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        blockNumber: "0x" + BI.from(12345 - 1).toString(16),
      },
      cellSinceValidationInfo
    )
  );
});

test("validateSince, relative blockNumber", (t) => {
  const since = generateSince({
    relative: true,
    type: "blockNumber",
    value: BI.from("12345"),
  });

  const cellSinceValidationInfo = {
    blockNumber: "0x" + BI.from(11).toString(16),
  };

  t.true(
    validateSince(
      since,
      {
        blockNumber: "0x" + BI.from(11 + 12345).toString(16),
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        blockNumber: "0x" + BI.from(11 + 12345 - 1).toString(16),
      },
      cellSinceValidationInfo
    )
  );
});

test("validateSince, absolute blockTimestamp", (t) => {
  const timestamp = BI.from(+new Date("2020-04-01")).div(1000);
  const since = generateSince({
    relative: false,
    type: "blockTimestamp",
    value: BI.from(timestamp.toString()),
  });

  const cellSinceValidationInfo = {
    // timestamp: "0x" + BigInt(+new Date("2020-01-01")).toString(16),
  };
  const validTipMedianTimestamp = "0x" + timestamp.mul(1000).toString(16);
  const invalidTipMedianTimestamp =
    "0x" + timestamp.mul(1000).sub(1).toString(16);
  t.true(
    validateSince(
      since,
      {
        median_timestamp: validTipMedianTimestamp,
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        median_timestamp: invalidTipMedianTimestamp,
      },
      cellSinceValidationInfo
    )
  );
});

test("validateSince, relative blockTimestamp", (t) => {
  const timestamp = BI.from(14 * 24 * 60 * 60);
  const since = generateSince({
    relative: true,
    type: "blockTimestamp",
    value: BI.from(timestamp.toString()),
  });

  const cellMedianTimestamp =
    "0x" + BI.from(+new Date("2020-01-01")).toString(16);
  const cellSinceValidationInfo = {
    median_timestamp: cellMedianTimestamp,
  };

  const validTipMedianTimestamp =
    "0x" + BI.from(cellMedianTimestamp).add(timestamp.mul(1000)).toString(16);
  const invalidTipMedianTimestamp =
    "0x" +
    BI.from(cellMedianTimestamp).add(timestamp.mul(1000)).sub(1).toString(16);
  t.true(
    validateSince(
      since,
      {
        median_timestamp: validTipMedianTimestamp,
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        median_timestamp: invalidTipMedianTimestamp,
      },
      cellSinceValidationInfo
    )
  );
});

test("validateSince, absolute epochNumber", (t) => {
  const value = {
    number: 1024,
    index: 0,
    length: 0,
  };
  const since = generateSince({
    relative: false,
    type: "epochNumber",
    value: value,
  });

  const cellSinceValidationInfo = {
    epoch: generateHeaderEpoch({
      number: 1000,
      index: 0,
      length: 0,
    }),
  };

  t.true(
    validateSince(
      since,
      {
        epoch: generateHeaderEpoch(value),
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 1023,
          length: 1800,
          index: 1799,
        }),
      },
      cellSinceValidationInfo
    )
  );
});

test("validateSince, relative epochNumber", (t) => {
  const value = {
    number: 1024,
    index: 0,
    length: 0,
  };
  const since = generateSince({
    relative: true,
    type: "epochNumber",
    value: value,
  });

  const cellSinceValidationInfo = {
    epoch: generateHeaderEpoch({
      number: 1000,
      index: 0,
      length: 0,
    }),
  };

  t.true(
    validateSince(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 2024,
          length: 0,
          index: 0,
        }),
      },
      cellSinceValidationInfo
    )
  );
  t.false(
    validateSince(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 2023,
          length: 1800,
          index: 1799,
        }),
      },
      cellSinceValidationInfo
    )
  );
});

test("validateAbsoluteEpochSince", (t) => {
  const value = {
    number: 1024,
    index: 0,
    length: 0,
  };
  const since = generateSince({
    relative: false,
    type: "epochNumber",
    value: value,
  });
  t.true(validateAbsoluteEpochSince(since, generateHeaderEpoch(value)));
});

test("maximumAbsoluteEpochSince", (t) => {
  const one = generateAbsoluteEpochSince({
    number: 1024,
    length: 1800,
    index: 1000,
  });
  const another = generateAbsoluteEpochSince({
    number: 1024,
    length: 1800,
    index: 1001,
  });

  t.is(maximumAbsoluteEpochSince(one, another), another);
});
