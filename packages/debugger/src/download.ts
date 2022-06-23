import download from "download";
import * as os from "os";
import envPaths from "env-paths";
import path from "path";
import * as fs from "fs";
import { CKB_DEBUGGER_VERSION } from "./constants";

export interface DownloadDebuggerOptions {
  version?: string;
  dir?: string;
}

export class CKBDebuggerDownloader {
  readonly config: Required<DownloadDebuggerOptions>;

  constructor(options?: DownloadDebuggerOptions) {
    const version = options?.version || CKB_DEBUGGER_VERSION;

    const saveToPath =
      options?.dir || envPaths("ckb-debugger", { suffix: version }).cache;

    this.config = { dir: saveToPath, version };
  }

  async downloadIfNotExists(): Promise<string> {
    if (await this.hasDownloaded()) {
      return path.join(this.config.dir, "ckb-debugger");
    }

    const { version, dir } = this.config;

    const osType = (() => {
      const type = os.type();

      if (type === "Windows_NT") return "windows";
      if (type === "Darwin") return "macos";
      if (type === "Linux") return "linux";

      throw new Error("Unsupported OS " + type);
    })();

    const url = `https://github.com/nervosnetwork/ckb-standalone-debugger/releases/download/v${version}/ckb-debugger-${osType}-x64.tar.gz`;
    await download(url, dir, { extract: true });
    return path.join(dir, "ckb-debugger");
  }

  async hasDownloaded(): Promise<boolean> {
    // TODO compare the downloaded version with the version in the options
    return fs.existsSync(path.join(this.config.dir, "ckb-debugger"));
  }

  getDebuggerPath(): string {
    return path.join(this.config.dir, "ckb-debugger");
  }
}
