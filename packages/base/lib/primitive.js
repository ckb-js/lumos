// for typescript
const JSBI = require("jsbi");

const originBigInt = JSBI.BigInt;

JSBI.BigInt = function (x) {
  if (typeof x === "bigint") {
    return originBigInt(x.toString());
  }
  return originBigInt(x);
};

const maybeJSBI = {
  toNumber: function toNumber(a) {
    return typeof a === "object" ? JSBI.toNumber(a) : Number(a);
  },
  add: function add(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.add(a, b)
      : a + b;
  },
  subtract: function subtract(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.subtract(a, b)
      : a - b;
  },
  multiply: function multiply(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.multiply(a, b)
      : a * b;
  },
  divide: function divide(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.divide(a, b)
      : a / b;
  },
  remainder: function remainder(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.remainder(a, b)
      : a % b;
  },
  exponentiate: function exponentiate(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.exponentiate(a, b)
      : typeof a === "bigint" && typeof b === "bigint"
      ? new Function("a**b", "a", "b")(a, b)
      : Math.pow(a, b);
  },
  leftShift: function leftShift(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.leftShift(a, b)
      : a << b;
  },
  signedRightShift: function signedRightShift(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.signedRightShift(a, b)
      : a >> b;
  },
  bitwiseAnd: function bitwiseAnd(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.bitwiseAnd(a, b)
      : a & b;
  },
  bitwiseOr: function bitwiseOr(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.bitwiseOr(a, b)
      : a | b;
  },
  bitwiseXor: function bitwiseXor(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.bitwiseXor(a, b)
      : a ^ b;
  },
  lessThan: function lessThan(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.lessThan(a, b)
      : a < b;
  },
  greaterThan: function greaterThan(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.greaterThan(a, b)
      : a > b;
  },
  lessThanOrEqual: function lessOrEqualThan(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.lessThanOrEqual(a, b)
      : a <= b;
  },
  greaterThanOrEqual: function greaterOrEqualThan(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.greaterThanOrEqual(a, b)
      : a >= b;
  },
  equal: function equal(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.equal(a, b)
      : a === b;
  },
  notEqual: function notEqual(a, b) {
    return typeof a === "object" && typeof b === "object"
      ? JSBI.notEqual(a, b)
      : a !== b;
  },
  unaryMinus: function unaryMinus(a) {
    return typeof a === "object" ? JSBI.unaryMinus(a) : -a;
  },
  bitwiseNot: function bitwiseNot(a) {
    return typeof a === "object" ? JSBI.bitwiseNot(a) : ~a;
  },
};

function isJSBI(a) {
  if (!a || !a.constructor) return false;
  return typeof a === "object" && a.constructor === JSBI;
}
exports = module.exports = { JSBI, maybeJSBI, isJSBI };
