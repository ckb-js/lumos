const test = require("ava");

const { since } = require("../lib");
const {
  parseSince,
  generateSince,
  parseEpoch,
  largerAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  checkAbsoluteEpochSinceValid,
  checkSinceValid,
  generateHeaderEpoch,
} = since;

const fixtrues = [
  {
    since: "0x3039",
    parsed: {
      relative: false,
      type: "blockNumber",
      value: BigInt("12345"),
    },
  },
  {
    since: "0x400000005e83d980",
    parsed: {
      relative: false,
      type: "blockTimestamp",
      value: BigInt(+new Date("2020-04-01")) / BigInt(1000),
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
      value: BigInt("100"),
    },
  },
  {
    since: "0xc000000000127500",
    parsed: {
      relative: true,
      type: "blockTimestamp",
      value: BigInt(14 * 24 * 60 * 60),
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
  epoch: "0x" + BigInt("1979121332649985").toString(16),
  parsed: {
    length: 1800,
    index: 24,
    number: 1,
  },
};

test("parsedSince", (t) => {
  fixtrues.forEach((v) => {
    const parsed = parseSince(v.since);
    t.deepEqual(parsed, v.parsed);
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

test("checkSinceValid, absolute blockNumber", (t) => {
  const since = generateSince({
    relative: false,
    type: "blockNumber",
    value: BigInt("12345"),
  });

  const sinceHeader = {
    number: "0x" + BigInt(11).toString(16),
  };

  t.true(
    checkSinceValid(
      since,
      { number: "0x" + BigInt(12345).toString(16) },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      { number: "0x" + BigInt(12345 - 1).toString(16) },
      sinceHeader
    )
  );
});

test("checkSinceValid, relative blockNumber", (t) => {
  const since = generateSince({
    relative: true,
    type: "blockNumber",
    value: BigInt("12345"),
  });

  const sinceHeader = {
    number: "0x" + BigInt(11).toString(16),
  };

  t.true(
    checkSinceValid(
      since,
      { number: "0x" + BigInt(11 + 12345).toString(16) },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      { number: "0x" + BigInt(11 + 12345 - 1).toString(16) },
      sinceHeader
    )
  );
});

test("checkSinceValid, absolute blockTimestamp", (t) => {
  const timestamp = BigInt(+new Date("2020-04-01")) / BigInt(1000);
  const since = generateSince({
    relative: false,
    type: "blockTimestamp",
    value: timestamp,
  });

  const sinceHeader = {
    timestamp: "0x" + BigInt(+new Date("2020-01-01")).toString(16),
  };

  t.true(
    checkSinceValid(
      since,
      { timestamp: "0x" + (timestamp * 1000n).toString(16) },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      { timestamp: "0x" + (timestamp * 1000n - 1n).toString(16) },
      sinceHeader
    )
  );
});

test("checkSinceValid, relative blockTimestamp", (t) => {
  const timestamp = BigInt(14 * 24 * 60 * 60);
  const since = generateSince({
    relative: true,
    type: "blockTimestamp",
    value: timestamp,
  });

  const sinceHeader = {
    timestamp: BigInt(+new Date("2020-01-01")),
  };

  t.true(
    checkSinceValid(
      since,
      {
        timestamp:
          "0x" + (sinceHeader.timestamp + timestamp * 1000n).toString(16),
      },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      {
        timestamp:
          "0x" + (sinceHeader.timestamp + timestamp * 1000n - 1n).toString(16),
      },
      sinceHeader
    )
  );
});

test("checkSinceValid, absolute epochNumber", (t) => {
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

  const sinceHeader = {
    epoch: generateHeaderEpoch({
      number: 1000,
      index: 0,
      length: 0,
    }),
  };

  t.true(
    checkSinceValid(since, { epoch: generateHeaderEpoch(value) }, sinceHeader)
  );
  t.false(
    checkSinceValid(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 1023,
          length: 1800,
          index: 1799,
        }),
      },
      sinceHeader
    )
  );
});

test("checkSinceValid, relative epochNumber", (t) => {
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

  const sinceHeader = {
    epoch: generateHeaderEpoch({
      number: 1000,
      index: 0,
      length: 0,
    }),
  };

  t.true(
    checkSinceValid(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 2024,
          length: 0,
          index: 0,
        }),
      },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      {
        epoch: generateHeaderEpoch({
          number: 2023,
          length: 1800,
          index: 1799,
        }),
      },
      sinceHeader
    )
  );
});

test("checkAbsoluteEpochSinceValid", (t) => {
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
  t.true(checkAbsoluteEpochSinceValid(since, generateHeaderEpoch(value)));
});

test("largerAbsoluteEpochSince", (t) => {
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

  t.is(largerAbsoluteEpochSince(one, another), another);
});
