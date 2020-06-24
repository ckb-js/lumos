# `@ckb-lumos/sql-indexer`

CKB indexer using SQL as the storage backend.

While the SQL based indexer provides the same interface as the basic RocksDB based indexer, using a SQL backend means the developers are free to express more possible queries than the ones enabled in the CellCollector interface.

Note: this is a highly experimental package for now. We are still experimenting and evaluating the proper way to support CKB indexing into SQL database. We might rewrite this package completely at a later time.
