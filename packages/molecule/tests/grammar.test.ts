import test from "ava";
import { createParser } from "../src";

test("should parse sample", (t) => {
  const parser = createParser();
  const result = parser.parse(`
    /* Basic Types */
    array Uint8 [byte; 1]; // one byte Uint
  `);
  t.deepEqual(result, [
    { item: "byte", item_count: 1, name: "Uint8", type: "array" },
  ]);
});
test("should parse blockchain.mol", (t) => {
  const parser = createParser();
  // https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
  const result = parser.parse(`
  /* Basic Types */

  // as a byte array in little endian.
  array Uint32 [byte; 4];
  array Uint64 [byte; 8];
  array Uint128 [byte; 16];
  array Byte32 [byte; 32];
  array Uint256 [byte; 32];

  vector Bytes <byte>;
  option BytesOpt (Bytes);

  vector BytesVec <Bytes>;
  vector Byte32Vec <Byte32>;

  /* Types for Chain */

  option ScriptOpt (Script);

  array ProposalShortId [byte; 10];

  vector UncleBlockVec <UncleBlock>;
  vector TransactionVec <Transaction>;
  vector ProposalShortIdVec <ProposalShortId>;
  vector CellDepVec <CellDep>;
  vector CellInputVec <CellInput>;
  vector CellOutputVec <CellOutput>;

  table Script {
      code_hash:      Byte32,
      hash_type:      byte,
      args:           Bytes,
  }

  struct OutPoint {
      tx_hash:        Byte32,
      index:          Uint32,
  }

  struct CellInput {
      since:           Uint64,
      previous_output: OutPoint,
  }

  table CellOutput {
      capacity:       Uint64,
      lock:           Script,
      type_:          ScriptOpt,
  }

  struct CellDep {
      out_point:      OutPoint,
      dep_type:       byte,
  }

  table RawTransaction {
      version:        Uint32,
      cell_deps:      CellDepVec,
      header_deps:    Byte32Vec,
      inputs:         CellInputVec,
      outputs:        CellOutputVec,
      outputs_data:   BytesVec,
  }

  table Transaction {
      raw:            RawTransaction,
      witnesses:      BytesVec,
  }

  struct RawHeader {
      version:                Uint32,
      compact_target:         Uint32,
      timestamp:              Uint64,
      number:                 Uint64,
      epoch:                  Uint64,
      parent_hash:            Byte32,
      transactions_root:      Byte32,
      proposals_hash:         Byte32,
      extra_hash:             Byte32,
      dao:                    Byte32,
  }

  struct Header {
      raw:                    RawHeader,
      nonce:                  Uint128,
  }

  table UncleBlock {
      header:                 Header,
      proposals:              ProposalShortIdVec,
  }

  table Block {
      header:                 Header,
      uncles:                 UncleBlockVec,
      transactions:           TransactionVec,
      proposals:              ProposalShortIdVec,
  }

  table BlockV1 {
      header:                 Header,
      uncles:                 UncleBlockVec,
      transactions:           TransactionVec,
      proposals:              ProposalShortIdVec,
      extension:              Bytes,
  }

  table CellbaseWitness {
      lock:    Script,
      message: Bytes,
  }

  table WitnessArgs {
      lock:                   BytesOpt,          // Lock args
      input_type:             BytesOpt,          // Type args for input
      output_type:            BytesOpt,          // Type args for output
  }
  `);
  t.deepEqual(result, [
    { type: "array", name: "Uint32", item: "byte", item_count: 4 },
    { type: "array", name: "Uint64", item: "byte", item_count: 8 },
    { type: "array", name: "Uint128", item: "byte", item_count: 16 },
    { type: "array", name: "Byte32", item: "byte", item_count: 32 },
    { type: "array", name: "Uint256", item: "byte", item_count: 32 },
    { type: "vector", name: "Bytes", item: "byte" },
    { type: "option", name: "BytesOpt", item: "Bytes" },
    { type: "vector", name: "BytesVec", item: "Bytes" },
    { type: "vector", name: "Byte32Vec", item: "Byte32" },
    { type: "option", name: "ScriptOpt", item: "Script" },
    { type: "array", name: "ProposalShortId", item: "byte", item_count: 10 },
    { type: "vector", name: "UncleBlockVec", item: "UncleBlock" },
    { type: "vector", name: "TransactionVec", item: "Transaction" },
    { type: "vector", name: "ProposalShortIdVec", item: "ProposalShortId" },
    { type: "vector", name: "CellDepVec", item: "CellDep" },
    { type: "vector", name: "CellInputVec", item: "CellInput" },
    { type: "vector", name: "CellOutputVec", item: "CellOutput" },
    {
      type: "table",
      name: "Script",
      fields: [
        { name: "code_hash", type: "Byte32" },
        { name: "hash_type", type: "byte" },
        { name: "args", type: "Bytes" },
      ],
    },
    {
      type: "struct",
      name: "OutPoint",
      fields: [
        { name: "tx_hash", type: "Byte32" },
        { name: "index", type: "Uint32" },
      ],
    },
    {
      type: "struct",
      name: "CellInput",
      fields: [
        { name: "since", type: "Uint64" },
        { name: "previous_output", type: "OutPoint" },
      ],
    },
    {
      type: "table",
      name: "CellOutput",
      fields: [
        { name: "capacity", type: "Uint64" },
        { name: "lock", type: "Script" },
        { name: "type_", type: "ScriptOpt" },
      ],
    },
    {
      type: "struct",
      name: "CellDep",
      fields: [
        { name: "out_point", type: "OutPoint" },
        { name: "dep_type", type: "byte" },
      ],
    },
    {
      type: "table",
      name: "RawTransaction",
      fields: [
        { name: "version", type: "Uint32" },
        { name: "cell_deps", type: "CellDepVec" },
        { name: "header_deps", type: "Byte32Vec" },
        { name: "inputs", type: "CellInputVec" },
        { name: "outputs", type: "CellOutputVec" },
        { name: "outputs_data", type: "BytesVec" },
      ],
    },
    {
      type: "table",
      name: "Transaction",
      fields: [
        { name: "raw", type: "RawTransaction" },
        { name: "witnesses", type: "BytesVec" },
      ],
    },
    {
      type: "struct",
      name: "RawHeader",
      fields: [
        { name: "version", type: "Uint32" },
        { name: "compact_target", type: "Uint32" },
        { name: "timestamp", type: "Uint64" },
        { name: "number", type: "Uint64" },
        { name: "epoch", type: "Uint64" },
        { name: "parent_hash", type: "Byte32" },
        { name: "transactions_root", type: "Byte32" },
        { name: "proposals_hash", type: "Byte32" },
        { name: "extra_hash", type: "Byte32" },
        { name: "dao", type: "Byte32" },
      ],
    },
    {
      type: "struct",
      name: "Header",
      fields: [
        { name: "raw", type: "RawHeader" },
        { name: "nonce", type: "Uint128" },
      ],
    },
    {
      type: "table",
      name: "UncleBlock",
      fields: [
        { name: "header", type: "Header" },
        { name: "proposals", type: "ProposalShortIdVec" },
      ],
    },
    {
      type: "table",
      name: "Block",
      fields: [
        { name: "header", type: "Header" },
        { name: "uncles", type: "UncleBlockVec" },
        { name: "transactions", type: "TransactionVec" },
        { name: "proposals", type: "ProposalShortIdVec" },
      ],
    },
    {
      type: "table",
      name: "BlockV1",
      fields: [
        { name: "header", type: "Header" },
        { name: "uncles", type: "UncleBlockVec" },
        { name: "transactions", type: "TransactionVec" },
        { name: "proposals", type: "ProposalShortIdVec" },
        { name: "extension", type: "Bytes" },
      ],
    },
    {
      type: "table",
      name: "CellbaseWitness",
      fields: [
        { name: "lock", type: "Script" },
        { name: "message", type: "Bytes" },
      ],
    },
    {
      type: "table",
      name: "WitnessArgs",
      fields: [
        { name: "lock", type: "BytesOpt" },
        { name: "input_type", type: "BytesOpt" },
        { name: "output_type", type: "BytesOpt" },
      ],
    },
  ]);
});
