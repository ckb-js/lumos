import test from "ava";
import { Indexer } from "../src";
const nodeUri = "http://127.0.0.1:8114";
const indexUri = "http://127.0.0.1:8116";
const indexer = new Indexer(nodeUri, indexUri);

// TODO uncomment me when subscribe is implemented
// test("throw error when pass both lock and type to subscribe", (t) => {
//   const error = t.throws(
//     () => {
//       const searchKey = { lock: lock, type: type };
//       indexer.getCells(searchKey);
//     },
//     { instanceOf: Error }
//   );
//   t.is(
//     error.message,
//     "The notification machanism only supports you subscribing for one script once so far!"
//   );
// });

test("throw error when pass both null lock and null type to subscribe", (t) => {
  const error = t.throws(
    () => {
      const queryOption = {};
      indexer.subscribe(queryOption);
    },
    { instanceOf: Error }
  );
  console.log(error);
  t.is(error.message, "unimplemented");
});
