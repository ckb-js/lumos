import { findFileSync } from "../utils";

export function findBinaryPath(destination: string): string | undefined {
  return findFileSync(destination, "ckb-light-client");
}
