import shell from "shelljs";
import compareVersions from "compare-versions";
import os from "os";
// TODO dep
import downloadAndExtract from "download";
import childProcess from "node:child_process";

function log(info: string): void {
  console.log(info);
}

let CKB_Indexer_Version = "0.2.2";

function getDownloadOsType() {
  const isOldVersion = parseInt(CKB_Indexer_Version.split(".")[1]) < 4; // before v4.0
  // it returns 'Linux' on Linux, 'Darwin' on macOS, and 'Windows_NT' on Windows.
  const osType = os.type();
  if (osType === "Linux") return "linux";
  if (osType === "Darwin" && isOldVersion) return "macos";
  if (osType === "Darwin") return "mac";

  // TODO support windows
  // if (osType === "Windows_NT") return "windows";

  throw new Error(`Unknown OS Type: ${osType}`);
}

const download = async () => {
  const isOldVersion = parseInt(CKB_Indexer_Version.split(".")[1]) < 4; // before v4.0
  const osType = getDownloadOsType();
  log("ckb-indexer not exist, downloading");
  log(`cwd is ${process.cwd()}`);

  const fileName = `ckb-indexer-${CKB_Indexer_Version}-${osType}${
    isOldVersion ? "" : "-x86_64"
  }.${osType === "linux" ? "tar.gz" : "zip"}`;

  const downloadUrl = `https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_Indexer_Version}/${fileName}`;

  log(
    `fileName is ${fileName}, osType is ${osType}, downloadUrl is ${downloadUrl}`
  );

  // TODO use option to extract
  await downloadAndExtract(downloadUrl, process.cwd());
  // const downloadCmd = `curl -O -L "${downloadUrl}"`;
  // shell.exec(downloadCmd);
  if (osType === "macos") {
    log(`exec unzip -o ./${fileName} -x README.md`);
    shell.exec(`unzip -o ./${fileName} -x README.md`);
    shell.chmod("+x", "./ckb-indexer");
    shell.rm("-rf", fileName);
  } else if (osType === "mac") {
    log(`exec unzip -o ./${fileName} -x README.md`);
    shell.exec(`unzip -o ./${fileName} -x README.md`);
    shell.chmod("+x", "./ckb-indexer");
    shell.rm("-rf", fileName);
  } else if (osType === "linux") {
    shell.exec(`tar xvzf ./${fileName} ckb-indexer`);
    shell.chmod("+x", "./ckb-indexer");
    shell.rm("-rf", fileName);
  }

  shell.rm(fileName);
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

  childProcess.exec(
    `RUST_LOG=info ./ckb-indexer -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8120 -s indexer-store-tmp`
  );
}
