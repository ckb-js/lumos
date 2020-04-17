const test = require("ava");
const indexer = require("../lib");

test("require should work", (t) => {
  t.truthy(indexer);
});
