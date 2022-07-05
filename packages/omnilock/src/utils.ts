/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cell, Script } from "@ckb-lumos/base";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";

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

/**
 *
 * @param inputs cells
 * @param locks scripts
 * @returns Map<string, number[]>, a map , key is script hash, values are indexes of cells which has a lock that matches script hash in key.
 */
export function groupInputs(
  inputs: Cell[],
  locks: Script[]
): Map<string, number[]> {
  const lockSet = new Set<string>();
  for (const lock of locks) {
    const scriptHash = computeScriptHash(lock);
    lockSet.add(scriptHash);
  }

  const groups = new Map<string, number[]>();
  for (let i = 0; i < inputs.length; i++) {
    const scriptHash = computeScriptHash(inputs[i].cell_output.lock);
    if (lockSet.has(scriptHash)) {
      if (groups.get(scriptHash) === undefined) groups.set(scriptHash, []);
      groups.get(scriptHash)!.push(i);
    }
  }
  return groups;
}

export function unimplemented(): never {
  throw new Error("unimplemented");
}
