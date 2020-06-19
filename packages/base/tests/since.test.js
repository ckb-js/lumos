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
    since: BigInt("0x0000000000003039"),
    parsed: {
      relative: false,
      type: "blockNumber",
      value: BigInt("12345"),
    },
  },
  {
    since: BigInt("0x400000005e83d980"),
    parsed: {
      relative: false,
      type: "blockTimestamp",
      value: BigInt(+new Date("2020-04-01")) / BigInt(1000),
    },
  },
  {
    since: BigInt("0x2000000000000400"),
    parsed: {
      relative: false,
      type: "epochNumber",
      value: {
        number: BigInt(1024),
        index: BigInt(0),
        length: BigInt(0),
      },
    },
  },
  {
    since: BigInt("0x8000000000000064"),
    parsed: {
      relative: true,
      type: "blockNumber",
      value: BigInt("100"),
    },
  },
  {
    since: BigInt("0xc000000000127500"),
    parsed: {
      relative: true,
      type: "blockTimestamp",
      value: BigInt(14 * 24 * 60 * 60),
    },
  },
  {
    since: BigInt("0xa000000000000018"),
    parsed: {
      relative: true,
      type: "epochNumber",
      value: {
        number: BigInt(24),
        length: BigInt(0),
        index: BigInt(0),
      },
    },
  },
];

const epochFixtrue = {
  epoch: BigInt("1979121332649985"),
  parsed: {
    length: BigInt(1800),
    index: BigInt(24),
    number: BigInt(1),
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
    number: BigInt(1024),
    index: BigInt(0),
    length: BigInt(0),
  };
  const since = generateSince({
    relative: false,
    type: "epochNumber",
    value: value,
  });

  const sinceHeader = {
    epoch:
      "0x" +
      generateHeaderEpoch({
        number: 1000n,
        index: 0n,
        length: 0n,
      }).toString(16),
  };

  t.true(
    checkSinceValid(
      since,
      { epoch: "0x" + generateHeaderEpoch(value).toString(16) },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      {
        epoch:
          "0x" +
          generateHeaderEpoch({
            number: 1023n,
            length: 1800n,
            index: 1799n,
          }).toString(16),
      },
      sinceHeader
    )
  );
});

test("checkSinceValid, relative epochNumber", (t) => {
  const value = {
    number: BigInt(1024),
    index: BigInt(0),
    length: BigInt(0),
  };
  const since = generateSince({
    relative: true,
    type: "epochNumber",
    value: value,
  });

  const sinceHeader = {
    epoch:
      "0x" +
      generateHeaderEpoch({
        number: 1000n,
        index: 0n,
        length: 0n,
      }).toString(16),
  };

  t.true(
    checkSinceValid(
      since,
      {
        epoch:
          "0x" +
          generateHeaderEpoch({
            number: 2024n,
            length: 0n,
            index: 0n,
          }).toString(16),
      },
      sinceHeader
    )
  );
  t.false(
    checkSinceValid(
      since,
      {
        epoch:
          "0x" +
          generateHeaderEpoch({
            number: 2023n,
            length: 1800n,
            index: 1799n,
          }).toString(16),
      },
      sinceHeader
    )
  );
});

test("checkAbsoluteEpochSinceValid", (t) => {
  const value = {
    number: BigInt(1024),
    index: BigInt(0),
    length: BigInt(0),
  };
  const since = generateSince({
    relative: false,
    type: "epochNumber",
    value: value,
  });
  t.true(
    checkAbsoluteEpochSinceValid(
      since,
      "0x" + generateHeaderEpoch(value).toString(16)
    )
  );
});

test("largerAbsoluteEpochSince", (t) => {
  const one = generateAbsoluteEpochSince({
    number: 1024n,
    length: 1800n,
    index: 1000n,
  });
  const another = generateAbsoluteEpochSince({
    number: 1024n,
    length: 1800n,
    index: 1001n,
  });

  t.is(largerAbsoluteEpochSince(one, another), another);
});
