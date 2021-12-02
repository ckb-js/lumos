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
    return isJSBI(a) ? JSBI.toNumber(a) : Number(a);
  },
  add: function add(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.add(a, b) : a + b;
  },
  subtract: function subtract(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.subtract(a, b) : a - b;
  },
  multiply: function multiply(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.multiply(a, b) : a * b;
  },
  divide: function divide(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.divide(a, b) : a / b;
  },
  remainder: function remainder(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.remainder(a, b) : a % b;
  },
  exponentiate: function exponentiate(a, b) {
    return isJSBI(a) && isJSBI(b)
      ? JSBI.exponentiate(a, b)
      : typeof a === "bigint" && typeof b === "bigint"
      ? new Function("a**b", "a", "b")(a, b)
      : Math.pow(a, b);
  },
  leftShift: function leftShift(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.leftShift(a, b) : a << b;
  },
  signedRightShift: function signedRightShift(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.signedRightShift(a, b) : a >> b;
  },
  bitwiseAnd: function bitwiseAnd(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.bitwiseAnd(a, b) : a & b;
  },
  bitwiseOr: function bitwiseOr(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.bitwiseOr(a, b) : a | b;
  },
  bitwiseXor: function bitwiseXor(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.bitwiseXor(a, b) : a ^ b;
  },
  lessThan: function lessThan(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.lessThan(a, b) : a < b;
  },
  greaterThan: function greaterThan(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.greaterThan(a, b) : a > b;
  },
  lessThanOrEqual: function lessOrEqualThan(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.lessThanOrEqual(a, b) : a <= b;
  },
  greaterThanOrEqual: function greaterOrEqualThan(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.greaterThanOrEqual(a, b) : a >= b;
  },
  equal: function equal(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.equal(a, b) : a === b;
  },
  notEqual: function notEqual(a, b) {
    return isJSBI(a) && isJSBI(b) ? JSBI.notEqual(a, b) : a !== b;
  },
  unaryMinus: function unaryMinus(a) {
    return isJSBI(a) ? JSBI.unaryMinus(a) : -a;
  },
  bitwiseNot: function bitwiseNot(a) {
    return isJSBI(a) ? JSBI.bitwiseNot(a) : ~a;
  },
};

function isJSBI(a) {
  if (!a || !a.constructor) return false;
  return typeof a === "object" && a.constructor === JSBI;
}
exports = module.exports = { JSBI, maybeJSBI, isJSBI };
