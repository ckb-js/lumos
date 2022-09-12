/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertBufferLength, isObjectLike } from "./utils";
import { bytify } from "./bytes";

export interface Codec<
  Packed,
  Unpacked,
  Packable = Unpacked,
  Unpackable = Packed
> {
  pack: (packable: Packable) => Packed;
  unpack: (unpackable: Unpackable) => Unpacked;
}

export type AnyCodec = Codec<any, any>;

export type PackResult<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packed
  : never;
export type PackParam<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packable
  : never;

export type UnpackResult<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Unpacked
  : never;

export type UnpackParam<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Unpackable
  : never;

export type Uint8ArrayCodec<Unpacked = any, Packable = Unpacked> = Codec<
  Uint8Array,
  Unpacked,
  Packable
>;

export type BytesLike = ArrayLike<number> | ArrayBuffer | string;

export type BytesCodec<Unpacked = any, Packable = Unpacked> = Codec<
  Uint8Array,
  Unpacked,
  Packable,
  BytesLike
>;

/**
 * This function helps to create a codec that can
 * @param codec
 */
export function createBytesCodec<Unpacked, Packable = Unpacked>(
  codec: Uint8ArrayCodec<Unpacked, Packable>
): BytesCodec<Unpacked, Packable> {
  return {
    pack: (unpacked) => codec.pack(unpacked),
    unpack: (bytesLike) => codec.unpack(bytify(bytesLike)),
  };
}

export type Fixed = {
  readonly __isFixedCodec__: true;
  readonly byteLength: number;
};

export type FixedBytesCodec<Unpacked = any, Packable = Unpacked> = BytesCodec<
  Unpacked,
  Packable
> &
  Fixed;

export function isFixedCodec<T>(
  codec: BytesCodec<T>
): codec is FixedBytesCodec<T> {
  return isObjectLike(codec) && !!codec.__isFixedCodec__;
}

export function createFixedBytesCodec<Unpacked, Packable = Unpacked>(
  codec: Uint8ArrayCodec<Unpacked, Packable> & { byteLength: number }
): FixedBytesCodec<Unpacked, Packable> {
  const byteLength = codec.byteLength;
  return {
    __isFixedCodec__: true,
    byteLength,
    ...createBytesCodec({
      pack: (u) => {
        const packed = codec.pack(u);
        assertBufferLength(packed, byteLength);
        return packed;
      },
      unpack: (buf) => {
        assertBufferLength(buf, byteLength);
        return codec.unpack(buf);
      },
    }),
  };
}

const LAST_ACCESS_PATH = Symbol("PACKABLE_ACCESS_PATH");

export class CodecBaseParseError extends Error {
  constructor(message: string, public expectedType: string) {
    super(message);
  }
}

class CodecPackableProxyHandler<T extends Record<any, unknown> | any[]>
  implements ProxyHandler<T>
{
  constructor(
    private previousAccessPaths: PropertyKey[] = [],
    private onAccess?: (paths: PropertyKey[]) => unknown
  ) {}

  lastAccess: PropertyKey[] = [];

  get(target: T, p: string | symbol): any {
    if (p === LAST_ACCESS_PATH) {
      return this.lastAccess;
    }

    const value = target[p as keyof T];

    // property may be an array's index, but proxy will automatically parse it to string. so we need to convert it back to number
    const prop =
      Array.isArray(target) && /^\d+$/.test(p as string) ? Number(p) : p;
    const paths = [...this.previousAccessPaths, prop];
    const onAccess =
      this.onAccess ||
      ((paths: PropertyKey[]) => {
        this.lastAccess = paths;
      });
    if (!(p in (Reflect.getPrototypeOf(target) || Object.create(null)))) {
      onAccess(paths);
    }
    if (Array.isArray(value) || (value !== null && typeof value === "object")) {
      return new Proxy(
        value as any,
        new CodecPackableProxyHandler(paths, onAccess)
      );
    }

    return value;
  }
}

function createPackableProxy<T extends Record<any, unknown> | any[]>(
  packable: T
): T & { [LAST_ACCESS_PATH]: PropertyKey[] } {
  if (typeof packable === "number" || typeof packable === "string") {
    return packable;
  }
  return new Proxy(packable, new CodecPackableProxyHandler()) as T & {
    [LAST_ACCESS_PATH]: PropertyKey[];
  };
}

export function trackCodecErrorPath<T extends Codec<any, any>>(codec: T): T {
  return {
    ...codec,
    pack(packable) {
      const packableProxy = createPackableProxy(packable);

      try {
        return codec.pack(packableProxy);
      } catch (e) {
        const lastAccessPaths: PropertyKey[] = packableProxy[LAST_ACCESS_PATH];
        const paths = (lastAccessPaths as (number | string)[]).reduce(
          (acc, cur) => {
            return acc + (typeof cur === "number" ? `[${cur}]` : `.${cur}`);
          },
          "input"
        );
        if (e instanceof CodecBaseParseError) {
          throw new Error(
            `Expect type ${e.expectedType} in ${paths} but got error: ${e.message}`
          );
        }

        throw e;
      }
    },
  };
}
