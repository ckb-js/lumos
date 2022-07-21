const exceptions = require('../../lib/exceptions')
const fixtures = require('./fixtures.json')

describe('Test exceptions', () => {
  const fixtureTable = Object.entries(fixtures).map(([exceptionName, { params, expected }]) => [
    exceptionName,
    params,
    expected,
  ])
  test.each(fixtureTable)(`%s`, (exceptionName, params, expected) => {
    const err = new exceptions[exceptionName](...params)
    expect(err.code).toBe(expected.code)
    expect(err.message).toBe(expected.message)
    if (err.index) {
      expect(err.index).toBe(expected.index)
    }
  })
})
