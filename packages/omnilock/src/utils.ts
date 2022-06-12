/* eslint-disable @typescript-eslint/no-explicit-any */

type KeyFromValue<V, T extends Record<PropertyKey, PropertyKey>> = {
  [K in keyof T]: V extends T[K] ? K : never;
}[keyof T];

type InvertKV<T extends Record<PropertyKey, PropertyKey>> = {
  [V in T[keyof T]]: KeyFromValue<V, T>;
};

export function invertKV<O extends Record<string | number, string | number>>(
  obj: O
): InvertKV<O> {
  return Object.entries(obj).reduce(
    (result, [k, v]) => Object.assign(result, { [v]: k }),
    {} as InvertKV<O>
  );
}

export function isKeyOf<O>(obj: O, key: PropertyKey): key is keyof O {
  if (obj == null) return false;
  return key in obj;
}

export function unimplemented(): never {
  throw new Error("unimplemented");
}
