#!/usr/bin/env node

const { exec } = require("child_process");

exec("yarn workspace @ckb-lumos/testkit start", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});

exec(".\ckb-indexer.exe  -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8120 -s indexer-store-tmp", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});