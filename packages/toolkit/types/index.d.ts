import JSBI from "jsbi";

export * as validators from "./validators";

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export class Reader {
  constructor(reader: string | ArrayBuffer | Reader);
  static fromRawString(s: string): Reader;
  static isReader(x: unknown): x is Reader;
  static from(x: string | ArrayBuffer | Reader | Uint8Array): Reader;

  length(): number;
  indexAt(i: number): number;
  toArrayBuffer(): ArrayBuffer;
  serializeJson(): string;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function HexStringToBigInt(hexString: string): JSBI;
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function BigIntToHexString(i: JSBI): string;

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export interface TransformerOptions {
  validation?: boolean;
  debugPath?: string;
}
type TransformerFunction = (
  value: object,
  options?: TransformerOptions
) => object;

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
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

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export interface NormalizerOptions {
  debugPath?: string;
}
type NormalizerFunction = (
  value: object,
  options?: NormalizerOptions
) => object;

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
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

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export interface Cell {
  cell_output: object;
  out_point: object;
  block_hash: string;
  data?: string;
  block_number?: string;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export type DepGroupUnpacker = (data: Reader) => Array<object>;
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */

export const VERSION: string;
