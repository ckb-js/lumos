const resultFmt = require('../../lib/resultFormatter')
const fixtures = require('./result.fixtures.json')

describe('result formatter', () => {
  describe.each(Object.keys(fixtures))('%s', methodName => {
    const fixtureTable = Object.values(fixtures[methodName]).map(({ result, expected, exception }) => [
      result,
      expected,
      exception,
    ])
    test.each(fixtureTable)('%j => %j', (result, expected, exception) => {
      if (undefined !== expected) {
        const formatted = resultFmt[methodName](result)
        expect(formatted).toEqual(expected)
      }
      if (undefined !== exception) {
        expect(resultFmt[methodName](result)).toThrow(new Error(exception))
      }
    })
  })
})
