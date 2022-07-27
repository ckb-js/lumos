import { startCKBIndexer } from "@ckb-lumos/testkit";
import { Indexer } from "../src";

startCKBIndexer(8118, 8120, Indexer.version);
