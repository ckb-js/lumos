import { writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { asyncSleep } from "./utils";

export type Promisify<T> = T | Promise<T>;

export interface FaucetQueue {
  initialKeys(keys: Array<string>): Promisify<void>;
  releaseKey(key: string): Promisify<void>;
  popIdleKey(): Promisify<string>;
}

export class MockFaucetQueue implements FaucetQueue {
  private keyList: {
    privateKey: string;
    status: "idle" | "claiming";
  }[] = [];

  initialKeys(keys: Array<string>): void {
    keys.map((pk) => this.keyList.push({ privateKey: pk, status: "idle" }));
  }

  private _lockKey(pk: string): void {
    const index = this.keyList.findIndex((key) => key.privateKey === pk);
    if (index === -1) {
      throw new Error(`not found pk: ${pk}`);
    }

    this.keyList[index].status = "claiming";
  }

  releaseKey(pk: string): void {
    const index = this.keyList.findIndex((key) => key.privateKey === pk);
    if (index === -1) {
      throw new Error(`not found pk: ${pk}`);
    }

    this.keyList[index].status = "idle";
  }

  async popIdleKey(): Promise<string> {
    const waitHadIdle = async () => {
      let hadIdle = false;
      while (!hadIdle) {
        hadIdle = this.keyList.findIndex((key) => key.status === "idle") !== -1;
        await asyncSleep(1000);
      }
    };
    await waitHadIdle();
    const key = this.keyList.find((key) => key.status === "idle");

    if (!key) {
      return this.popIdleKey();
    }

    this._lockKey(key.privateKey);
    return key.privateKey;
  }
}

export class FileFaucetQueue implements FaucetQueue {
  dirPath: string;
  pks: string[] = [];

  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }

  initialKeys(keys: Array<string>): void {
    this.pks = keys;
    this.pks.map((pk) => writeFileSync(join(this.dirPath, pk), "1"));
  }

  private _lockKey(pk: string): void {
    rmSync(join(this.dirPath, pk));
  }

  releaseKey(pk: string): void {
    writeFileSync(join(this.dirPath, pk), "1");
  }

  async popIdleKey(): Promise<string> {
    let idlePk: string | undefined = undefined;
    while (idlePk === undefined) {
      await asyncSleep(200);
      idlePk = this.pks.find((pk) => existsSync(join(this.dirPath, pk)));
    }

    try {
      this._lockKey(idlePk);
    } catch {
      return this.popIdleKey();
    }

    return idlePk;
  }
}
