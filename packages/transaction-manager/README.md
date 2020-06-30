# `@ckb-lumos/transaction-manager`

TransactionManager is a tool for manager uncommitted cells, you can `send_transaction` via this tool and get uncommitted outputs by `collector`.

## Usage

```javascript
const TransactionManager = require("@ckb-lumos/transaction-manager")
const { Indexer } = require("@ckb-lumos/indexer")

// generate a new `TransactionManager` instance and start.
const indexer = new Indexer("http://127.0.0.1:8114", "./indexer-data");
const transactionManager = new TransactionManager(indexer)
transactionManager.start()

// now you send transaction via `transactionManager`.
const txHash = await transactionManager.send_transaction(transaction)

// you can get uncommitted cells by `transactionManager.collector`.
const collector = transactionManager.collector({ lock })
for await (const cell of collector.collect()) {
  console.log(cell)
}
```
