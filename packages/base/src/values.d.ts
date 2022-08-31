import { OutPoint, RawTransaction, Script, Transaction } from "./api";
import { Hash } from "./primitive";

declare class Value {
  equals(other: Value): boolean;

  hashCode(): number;

  hash(): Hash;
}

export class ScriptValue extends Value {
  constructor(script: Script, options: { validate?: boolean });
}

export class OutPointValue extends Value {
  constructor(outPoint: OutPoint, options: { validate?: boolean });
}
export class RawTransactionValue extends Value {
  constructor(rawTransaction: RawTransaction, options?: { validate?: boolean });
}

export class TransactionValue extends Value {
  constructor(transaction: Transaction, options?: { validate?: boolean });
}
