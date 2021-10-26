import test from 'ava';
import {Indexer, CellCollector} from '../src';
import {HashType } from '@ckb-lumos/base';

const nodeUri = "http://127.0.0.1:8114";
const indexUri = "http://127.0.0.1:8116";
const indexer = new Indexer(nodeUri, indexUri);

test("get count correct", async (t) => {
  const type = {
    code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hash_type: 'type' as HashType,
    args: '0x4e9d00c34423f567029475c2c523772a1fb38c4d'
  }
  const cellCollector = new CellCollector(indexer, {lock: type})
  const count = await cellCollector.count();
  t.is(646, count);
});

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