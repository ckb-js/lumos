// This module provides a ValueObject implementation for CKB related data
// structures to allow seamless immutable.js integration.
const { validators, normalizers, Reader } = require("ckb-js-toolkit");
const XXHash = require("xxhash");
const core = require("./core");

class Value {
  constructor(buffer) {
    this.buffer = buffer;
  }

  equals(other) {
    return (
      new Reader(this.buffer).serializeJson() ===
      new Reader(other.buffer).serializeJson()
    );
  }

  hashCode() {
    return XXHash.hash(Buffer.from(this.buffer), 0);
  }
}

class TransactionValue extends Value {
  constructor(transaction, { validate = true } = {}) {
    if (validate) {
      validators.ValidateTransaction(transaction);
    }
    super(
      core.SerializeTransaction(normalizers.NormalizeTransaction(transaction))
    );
    this.transaction = transaction;
  }
}

module.exports = {
  TransactionValue,
};
