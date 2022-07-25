import { Script } from "@ckb-lumos/lumos";

export type Err = { error: string };

export function isErr(x: unknown): x is Err {
  return hasKeys(x, ["error"]);
}

export type MultiVersionAddress = {
  name: string | undefined;
  script: Script;
  ckb2019ShortFormat: string | undefined;
  ckb2019FullFormat: string | undefined;
  ckb2021FullFormat: string;
};

export function isMultiVersionAddress(x: unknown): x is MultiVersionAddress {
  return hasKeys(x, [
    "ckb2019ShortFormat",
    "ckb2019FullFormat",
    "ckb2021FullFormat",
    "name",
  ]);
}

function hasKeys<K extends string>(
  x: unknown,
  keys: K[]
): x is Record<K, unknown> {
  if (!x || typeof x !== "object") return false;
  return keys.every((key) => key in x);
}
