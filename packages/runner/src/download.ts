import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { lock, check } from "proper-lockfile";
import downloadExtract, { DownloadOptions } from "download";
import envPaths from "env-paths";
import { HttpsProxyAgent } from "hpagent";

/**
 * Get the default download destination directory
 * @param url
 */
export function getDefaultDownloadDestination(url: string): string {
  const name = path.parse(url).name;
  return envPaths(name).cache;
}

/**
 * @internal
 * @param url download URL
 * @param options
 */
export function download(
  url: string,
  options?: DownloadOptions
): Promise<string>;
/**
 * @internal
 * @param url download URL
 * @param destination download destination directory
 * @param options
 */
export function download(
  url: string,
  destination?: string,
  options?: DownloadOptions
): Promise<string>;
/**
 * @internal
 * @param url
 * @param destinationOrOptions
 */
export async function download(
  url: string,
  destinationOrOptions?: string | DownloadOptions
): Promise<string> {
  let destination: string;
  let options: DownloadOptions;

  if (!destinationOrOptions) {
    destination = getDefaultDownloadDestination(url);
    options = {};
  } else if (typeof destinationOrOptions === "string") {
    destination = destinationOrOptions;
    options = {};
  } else {
    destination = getDefaultDownloadDestination(url);
    options = destinationOrOptions;
  }

  const { agent, extract = true } = options;

  const isDownloading = await check(destination).then(
    (locked) => locked,
    () => false
  );

  if (isDownloading) {
    const release = await lock(destination, { retries: { forever: true } });
    await release();
    return destination;
  }

  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  const release = await lock(destination);
  const proxyAgent = (() => {
    if (agent) return { agent };

    const proxy = process.env.http_proxy || process.env.https_proxy;
    if (proxy) return { agent: new HttpsProxyAgent({ proxy }) };

    return {};
  })();

  await downloadExtract(url, destination, { extract, ...proxyAgent });
  await release();

  return destination;
}
