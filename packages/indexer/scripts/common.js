const spawn = require("child_process").spawn;

function exitWithError(data) {
  console.error(data);
  process.exit(1);
}

let stderr;
function exec(cmd, args) {
  stderr = "";
  return spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
  })
    .on("error", function (err) {
      exitWithError(`Exec error: ${err}, stderr: ${stderr}`);
    })
    .on("close", function (code) {
      if (code !== 0 || stderr.indexOf("ERR") !== -1) {
        exitWithError(`Exec error, code: ${code}, stderr: ${stderr}`);
      }
      process.exit(0);
    })
    .on("data", function (data) {
      stderr += String(data);
    });
}

module.exports = {
  exec,
  DEFAULT_LUMOS_VERSION: "9.0.2",
};
