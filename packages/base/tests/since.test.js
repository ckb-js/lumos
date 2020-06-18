const test = require('ava')

const { since } = require("../lib")
const { parseSince, generateSince } = since

const fixtrues = [
  {
    since: BigInt("0x0000000000003039"),
    parsed: {
      relative: false,
      type: "blockNumber",
      value: BigInt("12345"),
    }
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
    }
  },
  {
    since: BigInt("0xc000000000127500"),
    parsed: {
      relative: true,
      type: "blockTimestamp",
      value: BigInt(14 * 24 * 60 * 60)
    }
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
      }
    }
  }
]

test("parsedSince", t => {
  fixtrues.forEach(v => {
    const parsed = parseSince(v.since)
    t.deepEqual(parsed, v.parsed);
  })
})

test("generateSince", t => {
  fixtrues.forEach(v => {
    const since = generateSince(v.parsed)
    t.is(since, v.since)
  })
})
