import { writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { asyncSleep } from "./utils";
import { GENESIS_CELL_PRIVATEKEYS } from "./constants";

export type Promisify<T> = T | Promise<T>;

export interface FaucetQueue {
  pop(): Promisify<{
    value: string;
    onRelease: () => unknown;
  }>;
}

export class FileFaucetQueue implements FaucetQueue {
  static getInstance(): FileFaucetQueue {
    return new FileFaucetQueue(join(__dirname, "../tmp/"));
  }

  constructor(
    private dirPath: string,
    private keys: Array<string> = GENESIS_CELL_PRIVATEKEYS
  ) {
    this.keys.map((key) => this._releaseKey(key));
  }

  private _lockKey(key: string): void {
    rmSync(join(this.dirPath, key));
  }

  private _releaseKey(key: string): void {
    writeFileSync(join(this.dirPath, key), "1");
  }

  private _checkKey(key: string): boolean {
    return existsSync(join(this.dirPath, key));
  }

  async pop(): Promise<{
    value: string;
    onRelease: () => unknown;
  }> {
    let idle: string | undefined = undefined;
    while (idle === undefined) {
      await asyncSleep(200);
      idle = this.keys.find((key) => this._checkKey(key));
    }

    try {
      this._lockKey(idle);
    } catch {
      return this.pop();
    }

    const result = idle;

    return {
      value: result,
      onRelease: () => this._releaseKey(result),
    };
  }
}
