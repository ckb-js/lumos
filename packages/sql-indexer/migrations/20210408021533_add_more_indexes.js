exports.up = function (knex) {
  return knex.schema.table("cells", function (table) {
    table.index("block_number");
    table.index("lock_script_id");
    table.index("type_script_id");
  });
};

exports.down = function (knex) {
  return knex.schema.table("cells", function (table) {
    table.dropIndex("block_number");
    table.dropIndex("lock_script_id");
    table.dropIndex("type_script_id");
  });
};
