import { parse, join } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";

export function findFileSync(path: string, target: string): string | undefined {
  if (!existsSync(path)) return undefined;

  const stats = statSync(path);
  const parsed = parse(path);

  if (stats.isFile() && parsed.name === target) return path;
  if (stats.isFile() && parsed.name !== target) return undefined;

  if (!stats.isDirectory()) return undefined;

  const files = readdirSync(path);
  for (const subPath of files) {
    const found = findFileSync(join(path, subPath), target);
    if (found) return found;
  }

  return undefined;
}

/**
 * Pretty print a value. Can be used to print a value in a TOML file.
 * @internal
 * @param input
 */
export function stringify(input: bigint | number | string | string[]): string {
  if (typeof input === "string") {
    return `"${input}"`;
  }

  if (Array.isArray(input)) {
    const newline = input.length ? "\n" : "";
    const indent = input.length ? "  " : "";
    const content = input.map(stringify).join(",\n  ");
    return `[${newline}${indent}${content}${newline}]`;
  }

  if (typeof input === "number" || typeof input === "bigint") {
    return `${input}`;
  }

  throw new Error(`Unsupported type: ${typeof input}`);
}
