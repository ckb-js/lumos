import shell from "shelljs";
import compareVersions from "compare-versions";

let CKB_Indexer_Version = "0.2.2";
const download = () => {
  shell.echo("ckb-indexer not exist, downloading");
  shell.exec(
    `curl -O -L "https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_Indexer_Version}/ckb-indexer-${CKB_Indexer_Version}-linux.zip"`
  );
  shell.exec(`unzip -o ./ckb-indexer-${CKB_Indexer_Version}-linux.zip`);
  shell.exec(`tar xvzf ./ckb-indexer-linux-x86_64.tar.gz ckb-indexer`);
  shell.chmod("+x", "./ckb-indexer");
  shell.rm("-rf", "ckb-indexer-linux-x86_64.tar.gz");
  shell.rm(`ckb-indexer-${CKB_Indexer_Version}-linux.zip`);
  shell.exit(0);
};
export function downloadCKBIndexer() {
  if (!shell.test("-e", "./ckb-indexer")) {
    download();
  } else {
    const version = shell
      .exec(`./ckb-indexer -V`)
      .replace("\n", "")
      .split(" ")[1];
    console.log(compareVersions(version.toString(), CKB_Indexer_Version));
    if (compareVersions(version.toString(), CKB_Indexer_Version) !== 0) {
      shell.rm("-rf", "./ckb-indexer");
      download();
    }
  }
}

export function startCKBIndexer(CKBVersion?: string) {
  CKB_Indexer_Version = CKBVersion ? CKBVersion : CKB_Indexer_Version;
  downloadCKBIndexer();
  shell.exec(
    `nohup ./ckb-indexer -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8120 -s indexer-store-tmp`
  );
  shell.exec(`echo '{
                "id": 2,
                "jsonrpc": "2.0",
                "method": "get_tip"
            }' \
            | tr -d '\n' \
            | curl -H 'content-type: application/json' -d @- \
            http://localhost:8120`);
  shell.exit(0);
}
