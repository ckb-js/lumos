const { Indexer } = require("../lib");
const fs = require("fs");

const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    database: "sql_indexer_test",
    user: "travis",
  },
});

const knex2 = require("knex")({
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    database: "sql_indexer_test2",
    user: "travis",
  },
});

Indexer.prototype.initDbFromJsonFile = async function initDbFromJsonFile(
  filePath
) {
  let data = JSON.parse(fs.readFileSync(filePath));
  for (const block of data) {
    await this.append(block);
    await this.publishAppendBlockEvents(block);
  }
};

Indexer.prototype.clearDb = async function clearDb(filePath) {
  let data = JSON.parse(fs.readFileSync(filePath));
  for (const _block of data) {
    await this.publishRollbackEvents();
    await this.rollback();
  }
};

module.exports = { knex, knex2, Indexer };
