const { Indexer } = require("../lib");

Indexer.prototype.initDbFromJsonFile = function initDbFromJsonFile(file_path) {
  this.nativeIndexer.init_db_from_json_file(file_path);
};

Indexer.prototype.clearDb = function clearDb(filePath) {
  this.nativeIndexer.clear_db(filePath);
};
module.exports = { Indexer };
