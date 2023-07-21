import os from "os";

export interface Options {
  version?: string;
  platform?: "darwin" | "linux" | "win32";
}

/**
 * Get the release url of CKB binary
 * @param options
 */
export function getReleaseUrl(options: Options = {}): string {
  const { version = "v0.2.4", platform = os.platform() } = options;

  const compiledArch: string = (() => "x86_64")();

  const compiledPlatform: string = (() => {
    if (platform === "darwin") return "darwin";
    if (platform === "linux") return "linux";
    if (platform === "win32") return "windows";

    throw new Error("Unsupported platform: ${platform}");
  })();

  const filename = (() => {
    if (platform === "win32") {
      return `ckb-light-client_${version}-${compiledArch}-${compiledPlatform}`;
    }
    return `ckb-light-client_${version}-${compiledArch}-${compiledPlatform}-portable`;
  })();
  const ext = "tar.gz";

  return `https://github.com/nervosnetwork/ckb-light-client/releases/download/${version}/${filename}.${ext}`;
}
