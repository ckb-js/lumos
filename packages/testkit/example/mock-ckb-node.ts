import { createCKBMockRPC, mockData } from "../src";
import fs from "fs";
import path from "path";

const server = createCKBMockRPC({
  blocks: JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../ckb-indexer/tests/blocks_data.json")).toString()
  ),
  localNode: mockData.localNode(),
});

server.listen(8118, function () {
  console.log("🚀 server listen to 8118");
});
