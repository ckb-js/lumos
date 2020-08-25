// This module provides a ValueObject implementation for CKB related data
// structures to allow seamless immutable.js integration.
const { validators, normalizers, Reader } = require("ckb-js-toolkit");
const XXHash = require("xxhash");
const core = require("./core");
const { ckbHash } = require("./utils");

class Value {
  constructor(buffer, value) {
    this.buffer = buffer;
    this.value = value;
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

  hash() {
    return ckbHash(this.buffer).serializeJson();
  }
}

class ScriptValue extends Value {
  constructor(script, { validate = true } = {}) {
    if (validate) {
      validators.ValidateScript(script);
    }
    super(core.SerializeScript(normalizers.NormalizeScript(script)), script);
  }
}

class OutPointValue extends Value {
  constructor(outPoint, { validate = true } = {}) {
    if (validate) {
      validators.ValidateOutPoint(outPoint);
    }
    super(
      core.SerializeOutPoint(normalizers.NormalizeOutPoint(outPoint)),
      out_point
    );
  }
}

class RawTransactionValue extends Value {
  constructor(rawTransaction, { validate = true } = {}) {
    if (validate) {
      validators.ValidateRawTransaction(rawTransaction);
    }
    super(
      core.SerializeRawTransaction(
        normalizers.NormalizeRawTransaction(rawTransaction)
      ),
      transaction
    );
  }
}

class TransactionValue extends Value {
  constructor(transaction, { validate = true } = {}) {
    if (validate) {
      validators.ValidateTransaction(transaction);
    }
    super(
      core.SerializeTransaction(normalizers.NormalizeTransaction(transaction)),
      transaction
    );
  }
}

module.exports = {
  ScriptValue,
  OutPointValue,
  RawTransactionValue,
  TransactionValue,
};
