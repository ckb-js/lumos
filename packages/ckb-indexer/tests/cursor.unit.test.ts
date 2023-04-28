import test from "ava";
import {
  IndexerCursor,
  encodeCursor,
  decodeCursor,
} from "../src/indexerCursor";
import { HashType } from "@ckb-lumos/base";

// get cells from ckb node testnet
const fixtures = require("./indexerCursorFixtures.json");

test("should encode/decode cursor works fine when search type is 'lock'", async (t) => {
  fixtures.searchTypeIsLock.forEach((fixture: any) => {
    const lastCell = fixture.result.objects[0];
    const cursorObj: IndexerCursor = {
      searchType: "lock",
      script: {
        codeHash: lastCell.output.lock.code_hash,
        hashType: lastCell.output.lock.hash_type as HashType,
        args: lastCell.output.lock.args,
      },
      blockNumber: lastCell.block_number,
      txIndex: lastCell.tx_index,
      outputIndex: lastCell.out_point.index,
    };

    const encoded = encodeCursor(cursorObj);
    t.deepEqual(encoded, fixture.result.last_cursor);

    const decoded = decodeCursor(encoded);
    t.deepEqual(decoded, cursorObj);
  });
});

test("should encode/decode cursor works fine when search type is 'type'", async (t) => {
  fixtures.searchTypeIsType.forEach((fixture: any) => {
    const lastCell = fixture.result.objects[0];
    const cursorObj: IndexerCursor = {
      searchType: "type",
      script: {
        codeHash: lastCell.output.type.code_hash,
        hashType: lastCell.output.type.hash_type as HashType,
        args: lastCell.output.type.args,
      },
      blockNumber: lastCell.block_number,
      txIndex: lastCell.tx_index,
      outputIndex: lastCell.out_point.index,
    };

    const encoded = encodeCursor(cursorObj);
    t.deepEqual(encoded, fixture.result.last_cursor);

    const decoded = decodeCursor(encoded);
    t.deepEqual(decoded, cursorObj);
  });
});
