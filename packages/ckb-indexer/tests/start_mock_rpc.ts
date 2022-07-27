import { createCKBMockRPC, mockData } from "@ckb-lumos/testkit";
import fs from "fs";
import path from "path";

const blockDataPath = path.join(__dirname, "./blocks_data.json");
const blocksData = fs.readFileSync(blockDataPath, "utf8").toString();

console.log("blockDataPath", blockDataPath);
console.log("blocksData", blocksData.slice(0, 100));

const server = createCKBMockRPC({
  blocks: JSON.parse(blocksData),
  localNode: mockData.localNode(),
});

const app = server.listen(8118, function () {
  console.log("🚀 server listen to 8118");
});

server.get("/quit", function (req, res) {
  res.send("closing..");
  app.close();
});

export { app };
