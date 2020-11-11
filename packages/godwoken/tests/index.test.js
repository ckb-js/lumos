const test = require("ava");
const fs = require("fs");
const path = require("path");
const { Chain } = require("../lib");

const configPath = path.join(__dirname, "..", "config", "dev.config.json");

test("Init a chain by config", (t) => {
  let chain = new Chain(configPath);
  t.pass();
});
