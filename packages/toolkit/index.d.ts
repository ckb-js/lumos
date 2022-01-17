import JSBI from "jsbi";

export class Reader {
  constructor(reader: string | ArrayBuffer | Reader);
  static fromRawString(s: string): Reader;

  length(): number;
  indexAt(i: number): number;
  toArrayBuffer(): ArrayBuffer;
  serializeJson(): string;
}

export type RPCValue = any;
export type RPCSyncHandler = (...params: RPCValue[]) => RPCValue;
export type RPCHandler = (...params: RPCValue[]) => Promise<RPCValue>;

export class BatchRPCMethods {
  send: RPCHandler;
}

export class BatchRPCProxy {
  [method: string]: RPCSyncHandler;
}

export type BatchRPC = BatchRPCMethods & BatchRPCProxy;

export class RPCMethods {
  batch: () => BatchRPC;
}

export class RPCProxy {
  [method: string]: RPCHandler;
}

export class RPC {
  /**
   * To preserve compatibility, we still provide the default constructor
   * but it cannot tell if you are calling the sync method batch, or other
   * async methods. You will need to distinguish between them yourself.
   */
  constructor(uri: string, options?: object);
  [method: string]: RPCHandler | RPCSyncHandler;

  static create(uri: string): RPCMethods & RPCProxy;
}

export function HexStringToBigInt(hexString: string): JSBI;
export function BigIntToHexString(i: JSBI): string;

export interface ValidatorOptions {
  nestedValidation?: boolean;
  debugPath?: string;
}
type ValidatorFunction = (value: object, options?: ValidatorOptions) => void;

export namespace validators {
  const ValidateScript: ValidatorFunction;
  const ValidateOutPoint: ValidatorFunction;
  const ValidateCellInput: ValidatorFunction;
  const ValidateCellOutput: ValidatorFunction;
  const ValidateCellDep: ValidatorFunction;
  const ValidateRawTransaction: ValidatorFunction;
  const ValidateTransaction: ValidatorFunction;
  const ValidateRawHeader: ValidatorFunction;
  const ValidateHeader: ValidatorFunction;
  const ValidateUncleBlock: ValidatorFunction;
  const ValidateBlock: ValidatorFunction;
  const ValidateCellbaseWitness: ValidatorFunction;
  const ValidateWitnessArgs: ValidatorFunction;
}

export interface TransformerOptions {
  validation?: boolean;
  debugPath?: string;
}
type TransformerFunction = (
  value: object,
  options?: TransformerOptions
) => object;

export namespace transformers {
  const TransformScript: TransformerFunction;
  const TransformOutPoint: TransformerFunction;
  const TransformCellInput: TransformerFunction;
  const TransformCellOutput: TransformerFunction;
  const TransformCellDep: TransformerFunction;
  const TransformRawTransaction: TransformerFunction;
  const TransformTransaction: TransformerFunction;
  const TransformRawHeader: TransformerFunction;
  const TransformHeader: TransformerFunction;
  const TransformUncleBlock: TransformerFunction;
  const TransformBlock: TransformerFunction;
  const TransformCellbaseWitness: TransformerFunction;
  const TransformWitnessArgs: TransformerFunction;
}

export interface NormalizerOptions {
  debugPath?: string;
}
type NormalizerFunction = (
  value: object,
  options?: NormalizerOptions
) => object;

export namespace normalizers {
  const NormalizeScript: NormalizerFunction;
  const NormalizeOutPoint: NormalizerFunction;
  const NormalizeCellInput: NormalizerFunction;
  const NormalizeCellOutput: NormalizerFunction;
  const NormalizeCellDep: NormalizerFunction;
  const NormalizeRawTransaction: NormalizerFunction;
  const NormalizeTransaction: NormalizerFunction;
  const NormalizeRawHeader: NormalizerFunction;
  const NormalizeHeader: NormalizerFunction;
  const NormalizeUncleBlock: NormalizerFunction;
  const NormalizeBlock: NormalizerFunction;
  const NormalizeCellbaseWitness: NormalizerFunction;
  const NormalizeWitnessArgs: NormalizerFunction;
}

export interface Cell {
  cell_output: object;
  out_point: object;
  block_hash: string;
  data?: string;
  block_number?: string;
}

export interface CellCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Cell>;
}

export interface CellCollector {
  collect(): CellCollectorResults;
}

export namespace cell_collectors {
  interface RPCCollectorOptions {
    skipCellWithContent?: boolean;
    loadData?: boolean;
  }

  class RPCCollector implements CellCollector {
    constructor(rpc: RPC, lockHash: string, options?: RPCCollectorOptions);

    collect(): CellCollectorResults;
  }
}

export type DepGroupUnpacker = (data: Reader) => Array<object>;
export interface TransactionDumperOptions {
  validateTransaction?: boolean;
  depGroupUnpacker?: DepGroupUnpacker;
}

export class TransactionDumper {
  constructor(rpc: RPC, options?: TransactionDumperOptions);

  dump(tx: object): Promise<string>;
}

export const VERSION: string;
