import test from 'ava';
import {lock, type} from './test_cases';
import {Indexer, CellCollector} from '../src';
const nodeUri = "http://127.0.0.1:8114";
const indexUri = "http://127.0.0.1:8116";
const indexer = new Indexer(nodeUri, indexUri);

test("throw error when pass null lock and null type to CellCollector", (t) => {
    const error = t.throws(
      () => {
        const queryOptions = {};
        new CellCollector(indexer, queryOptions);
      },
      { instanceOf: Error }
    );
    t.is(error.message, "Either lock or type script must be provided!");
  });
