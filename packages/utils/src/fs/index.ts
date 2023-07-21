import { readFileSync, writeFileSync, writeFile, readFile } from "fs";

/**
 * Replace the content of a file.
 * @param path
 * @param replacer
 * @param callback
 */
export function replaceContent(
  path: string,
  replacer: (source: string) => string,
  callback: (err: NodeJS.ErrnoException | null) => void
): void {
  readFile(path, (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    writeFile(path, replacer(data.toString()), callback);
  });
}

/**
 * Replace the content of a file.
 * @param path
 * @param replacer
 */
export function replaceContentSync(
  path: string,
  replacer: (source: string) => string
): void {
  writeFileSync(path, replacer(readFileSync(path).toString()));
}
