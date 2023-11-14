import os from "os";

export interface GetReleaseUrlOptions {
  version?: string;
  arch?: "x64" | "arm64";
  platform?: "darwin" | "linux" | "win32";
}

/**
 * Get the release url of CKB binary
 * @param options
 */
export function getReleaseUrl(options: GetReleaseUrlOptions = {}): string {
  const {
    version = "v0.111.0",
    arch = os.arch(),
    platform = os.platform(),
  } = options;

  const compiledArch: string = (() => {
    if (arch === "x64") return "x86_64";
    if (arch === "arm64") return "aarch64";

    throw new Error("Unsupported arch: ${arch}");
  })();

  const compiledPlatform: string = (() => {
    if (platform === "darwin") return "apple-darwin";
    if (platform === "linux") return "unknown-linux-gnu";
    if (platform === "win32") return "pc-windows-msvc";

    throw new Error("Unsupported platform: ${platform}");
  })();

  const filename = (() => {
    const file = `ckb_${version}_${compiledArch}-${compiledPlatform}`;

    if (platform === "win32") return file;
    return `${file}-portable`;
  })();
  const ext = os.platform() === "linux" ? "tar.gz" : "zip";

  return `https://github.com/nervosnetwork/ckb/releases/download/${version}/${filename}.${ext}`;
}
