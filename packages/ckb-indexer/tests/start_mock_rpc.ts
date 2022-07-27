import { createCKBMockRPC, mockData } from "@ckb-lumos/testkit";
import fs from "fs";
import path from "path";

const server = createCKBMockRPC({
  blocks: JSON.parse(fs.readFileSync(path.join(__dirname, "./blocks_data.json")).toString()),
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
