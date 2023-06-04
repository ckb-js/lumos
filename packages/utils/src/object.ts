import { snakeToCamel } from "./string";

type AnyObject = Record<string, unknown>;
type KeyOf<T> = keyof T & string;

export function mapObject<T extends AnyObject, U extends AnyObject>(
  obj: T,
  map: <K extends KeyOf<T>>([key, value]: [K, T[K]]) => [string, unknown]
): U {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mappedKey, mappedValue] = map([key, value] as any);
    Object.assign(acc, { [mappedKey]: mappedValue });
    return acc;
  }, {} as U);
}

export function snakeToCamelKeys<T extends AnyObject, U extends AnyObject>(
  obj: T
): U {
  return mapObject(obj, ([key, value]) => [snakeToCamel(key), value]);
}

export function deepSnakeToCamelKeys<T extends AnyObject, U extends AnyObject>(
  obj: T
): U {
  if (!obj) {
    return obj;
  }
  return mapObject(obj, ([key, value]) => [
    snakeToCamel(key),
    typeof value === "object"
      ? deepSnakeToCamelKeys(value as AnyObject)
      : value,
  ]);
}
