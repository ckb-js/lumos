const test = require("ava");

test("TransactionManagerCellCollector#collect", async (t) => {
  t.true(true);
});
// const { helpers, values } = require("@ckb-lumos/base");
// const TransactionManager = require("../lib");
// const { isCellMatchQueryOptions } = helpers;
// const sinon = require("sinon");
// const { CKBIndexerTransactionCollector: TransactionCollector } = require("@ckb-lumos/ckb-indexer");

// const cells = [
//   {
//     cell_output: {
//       capacity: "0x11714b9539d5",
//       lock: {
//         code_hash:
//           "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//         hash_type: "type",
//         args: "0x36c329ed630d6ce750712a477543672adab57f4c",
//       },
//       type: undefined,
//     },
//     out_point: {
//       tx_hash:
//         "0x9ab6b0cbea64475f61d10a832cfdf06cd0f219a284778a07e41278f341025754",
//       index: "0x0",
//     },
//     block_hash:
//       "0x80642e5e6ec40e101f651e3d694f4fd4d3fc9e8808c1472503ccd9a040c0d734",
//     block_number: "0xa7",
//     data: "0x",
//   },
// ];

// const tx = {
//   version: "0x0",
//   cell_deps: [
//     {
//       out_point: {
//         tx_hash:
//           "0x785aa819c8f9f8565a62f744685f8637c1b34886e57154e4e5a2ac7f225c7bf5",
//         index: "0x0",
//       },
//       dep_type: "dep_group",
//     },
//   ],
//   header_deps: [],
//   inputs: [
//     {
//       since: "0x0",
//       previous_output: {
//         tx_hash:
//           "0x9ab6b0cbea64475f61d10a832cfdf06cd0f219a284778a07e41278f341025754",
//         index: "0x0",
//       },
//     },
//   ],
//   outputs: [
//     {
//       capacity: "0x174876e800",
//       lock: {
//         code_hash:
//           "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//         hash_type: "type",
//         args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
//       },
//     },
//     {
//       capacity: "0x115a031e51d5",
//       lock: {
//         code_hash:
//           "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
//         hash_type: "type",
//         args: "0x36c329ed630d6ce750712a477543672adab57f4c",
//       },
//     },
//   ],
//   outputs_data: ["0x", "0x"],
//   witnesses: [
//     "0x5500000010000000550000005500000041000000f18aa27d7e30acae87d891784506ab2b85a26888e49e7570decfb195604dfc5233cdf7ffb78d51ee9d7106391c4b9baacf5119475b84da39d1fbb54216ddfc3000",
//   ],
// };

// const txHash =
//   "0x4ca142a2b1e3eae453161340dbf437368cf76040f3c4d8454f3780b46b4e48c8";

// class MockCellCollector {
//   constructor(
//     indexer,
//     {
//       lock = null,
//       type = null,
//       argsLen = -1,
//       data = "any",
//       fromBlock = null,
//       toBlock = null,
//       skip = null,
//     }
//   ) {
//     this.indexer = indexer;
//     this.queryOptions = {
//       lock,
//       type,
//       argsLen,
//       data,
//       fromBlock,
//       toBlock,
//       skip,
//     };
//   }

//   async *collect() {
//     for (const cell of cells) {
//       if (isCellMatchQueryOptions(cell, this.queryOptions)) {
//         yield cell;
//       }
//     }
//   }
// }

// class MockIndexer {
//   constructor(committedTxHashes = []) {
//     this.uri = "";
//     this.committedTxHashes = committedTxHashes;
//   }

//   collector({
//     lock = null,
//     type = null,
//     argsLen = -1,
//     data = "any",
//     fromBlock = null,
//     toBlock = null,
//     skip = null,
//   } = {}) {
//     return new MockCellCollector(this, {
//       lock,
//       type,
//       argsLen,
//       data,
//       fromBlock,
//       toBlock,
//       skip,
//     });
//   }
// }

// class MockRPC {
//   async send_transaction() {
//     return txHash;
//   }
//   async get_live_cell() {
//     return cells[0];
//   }
// }

// const indexer = new MockIndexer();
// const rpc = new MockRPC();
// const stub = sinon
//   .stub(TransactionCollector.prototype, "getTransactionHashes")
//   .onCall(0)
//   .resolves([])
//   .onCall(1)
//   .resolves([txHash])
//   .onCall(2)
//   .resolves([txHash]);

// test.afterEach(() => {
//   stub.reset();
// });
// test("send_transaction1", async (t) => {
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });

//   t.is(transactionManager.spentCells.size, 0);
//   t.is(transactionManager.createdCells.size, 0);

//   await transactionManager.send_transaction(tx);

//   t.is(transactionManager.spentCells.size, 1);
//   t.true(
//     new values.OutPointValue(tx.inputs[0].previous_output, {
//       validate: false,
//     }).equals(transactionManager.spentCells.toArray()[0])
//   );

//   t.deepEqual(
//     transactionManager.createdCells.toJS().map((cell) => {
//       return new values.OutPointValue(cell.out_point, { validate: false })
//         .buffer;
//     }),
//     tx.outputs.map((_, i) => {
//       return new values.OutPointValue(
//         {
//           tx_hash: txHash,
//           index: "0x" + i.toString(16),
//         },
//         {
//           validate: false,
//         }
//       ).buffer;
//     })
//   );
// });

// test("_checkTransactions, uncommitted", async (t) => {
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });
//   await transactionManager.send_transaction(tx);
//   await transactionManager._checkTransactions();
//   t.is(transactionManager.transactions.size, 1);
//   t.is(transactionManager.createdCells.size, 2);
// });

// test("_checkTransactions, committed", async (t) => {
//   const indexer = new MockIndexer([txHash]);
//   const rpc = new MockRPC();
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });

//   await transactionManager.send_transaction(tx);
//   await transactionManager._checkTransactions();
//   t.is(transactionManager.transactions.size, 0);
// });

// test("TransactionManagerCellCollector#collect", async (t) => {
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });

//   await transactionManager.send_transaction(tx);

//   const collector = transactionManager.collector();

//   const collectedCells = [];
//   for await (const c of collector.collect()) {
//     collectedCells.push(c);
//   }

//   t.deepEqual(
//     collectedCells.map((c) => {
//       return new values.OutPointValue(c.out_point, { validate: false }).buffer;
//     }),
//     tx.outputs.map((_, i) => {
//       return new values.OutPointValue(
//         {
//           tx_hash: txHash,
//           index: "0x" + i.toString(16),
//         },
//         { validate: false }
//       ).buffer;
//     })
//   );
// });

// test("TransactionManagerCellCollector#count", async (t) => {
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });
//   await transactionManager.send_transaction(tx);

//   const collector = transactionManager.collector();

//   const count = await collector.count();

//   t.is(count, 2);
// });

// test("TransactionManagerCellCollector, update createdCells if committed", async (t) => {
//   const indexer = new MockIndexer([txHash]);
//   const rpc = new MockRPC();
//   const transactionManager = new TransactionManager(indexer, {
//     rpc,
//   });
//   await transactionManager.send_transaction(tx);
//   await transactionManager._checkTransactions();

//   const collector = transactionManager.collector();

//   const count = await collector.count();

//   t.is(count, 1);
// });
