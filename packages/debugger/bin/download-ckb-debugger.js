#! /usr/bin/env node

const { CKBDebuggerDownloader } = require("@ckb-lumos/debugger");

async function main() {
  const downloader = new CKBDebuggerDownloader();
  await downloader.downloadIfNotExists();

  console.log(`ckb-debugger has downloaded:`, downloader.getDebuggerPath());
}

main();
