// This module provides a ValueObject implementation for CKB related data
// structures to allow seamless immutable.js integration.
import { xxHash32 } from "js-xxhash";
import { ckbHash } from "./utils";
import { bytes } from "@ckb-lumos/codec";
import * as blockchain from "./blockchain";
import { OutPoint, RawTransaction, Script, Transaction } from "./api";
import { Hash } from "./primitive";

const { hexify } = bytes;
class Value {
  constructor(private buffer: Uint8Array) {}

  equals(other: Value): boolean {
    return hexify(this.buffer) === hexify(other.buffer);
  }

  hashCode(): number {
    return xxHash32(Buffer.from(this.buffer), 0);
  }

  hash(): Hash {
    return ckbHash(this.buffer);
  }
}

class ScriptValue extends Value {
  /**
   * @param script
   * @param _options @deprecated this parameter is unused and takes no effect, please remove it.
   */
  constructor(script: Script, _options: { validate?: boolean } = {}) {
    super(blockchain.Script.pack(script));
  }
}

class OutPointValue extends Value {
  /**
   * @param outPoint
   * @param _options @deprecated this parameter is unused and takes no effect, please remove it.
   */
  constructor(outPoint: OutPoint, _options: { validate?: boolean } = {}) {
    super(blockchain.OutPoint.pack(outPoint));
  }
}

class RawTransactionValue extends Value {
  /**
   * @param rawTransaction
   * @param _options @deprecated this parameter is unused and takes no effect, please remove it.
   */
  constructor(
    rawTransaction: RawTransaction,
    _options: { validate?: boolean } = {}
  ) {
    super(blockchain.RawTransaction.pack(rawTransaction));
  }
}

class TransactionValue extends Value {
  /**
   * @param transaction
   * @param _options @deprecated this parameter is unused and takes no effect, please remove it.
   */
  constructor(transaction: Transaction, _options: { validate?: boolean } = {}) {
    super(blockchain.Transaction.pack(transaction));
  }
}

export { ScriptValue, OutPointValue, RawTransactionValue, TransactionValue };
