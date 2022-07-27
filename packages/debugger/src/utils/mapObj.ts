/* eslint-disable @typescript-eslint/no-explicit-any */

type ValueOf<T> = T[keyof T];

export function mapObj<Obj extends Record<string, any>, Fn extends (v: ValueOf<Obj>, k: keyof Obj, i: number) => any>(
  obj: Obj,
  map: Fn
): Record<keyof Obj, ReturnType<Fn>> {
  if (!obj || typeof obj !== "object") {
    return {} as Record<keyof Obj, ReturnType<Fn>>;
  }

  return Object.entries(obj).reduce(
    (result, [key, val]: [keyof Obj, ValueOf<Obj>], i) =>
      Object.assign(result, { [key]: map(val as ValueOf<Obj>, key, i) }),
    {} as Record<keyof Obj, ReturnType<Fn>>
  );
}
