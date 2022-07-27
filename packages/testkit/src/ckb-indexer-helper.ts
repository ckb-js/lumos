import shell from "shelljs";
import compareVersions from "compare-versions";
import os from "os";
// TODO dep
import downloadAndExtract from "download";

function log(info: string): void {
  console.log(info);
}

function getDownloadOsType() {
  // it returns 'Linux' on Linux, 'Darwin' on macOS, and 'Windows_NT' on Windows.
  const osType = os.type();
  if (osType === "Linux") return "linux";
  if (osType === "Darwin") return "macos";
  // TODO support windows
  // if (osType === "Windows_NT") return "windows";

  throw new Error(`Unknown OS Type: ${osType}`);
}

let CKB_Indexer_Version = "0.2.2";
const download = async () => {
  const osType = getDownloadOsType();
  log("ckb-indexer not exist, downloading");
  log(`cwd is ${process.cwd()}`);
  const downloadUrl = `https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_Indexer_Version}/ckb-indexer-${CKB_Indexer_Version}-${osType}.zip`;

  // TODO use option to extract
  await downloadAndExtract(downloadUrl, process.cwd());
  // const downloadCmd = `curl -O -L "${downloadUrl}"`;
  // shell.exec(downloadCmd);
  shell.exec(`unzip -o ./ckb-indexer-${CKB_Indexer_Version}-${osType}.zip`);
  if (osType === "macos") {
    shell.exec(`unzip -o ./ckb-indexer-mac-x86_64.zip`);
    shell.chmod("+x", "./ckb-indexer");
    shell.rm("-rf", "ckb-indexer-linux-x86_64.zip");
  } else if (osType === "linux") {
    shell.exec(`tar xvzf ./ckb-indexer-linux-x86_64.tar.gz ckb-indexer`);
    shell.chmod("+x", "./ckb-indexer");
    shell.rm("-rf", "ckb-indexer-linux-x86_64.tar.gz");
  }

  shell.rm(`ckb-indexer-${CKB_Indexer_Version}-${osType}.zip`);
  log("artifacts removed");
};

export async function downloadCKBIndexer(): Promise<void> {
  if (!shell.test("-e", "./ckb-indexer")) {
    await download();
  } else {
    const version = shell
      .exec(`./ckb-indexer -V`)
      .replace("\n", "")
      .split(" ")[1];
    console.log(compareVersions(version.toString(), CKB_Indexer_Version));
    if (compareVersions(version.toString(), CKB_Indexer_Version) !== 0) {
      shell.rm("-rf", "./ckb-indexer");
      await download();
    }
  }
}

export async function startCKBIndexer(CKBVersion?: string): Promise<void> {
  CKB_Indexer_Version = CKBVersion ? CKBVersion : CKB_Indexer_Version;
  await downloadCKBIndexer();
  console.log("start indexer at", new Date().toLocaleString());

  shell.exec(
    `RUST_LOG=info ./ckb-indexer -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8120 -s indexer-store-tmp`,
    {
      async: true,
    }
  );
}
