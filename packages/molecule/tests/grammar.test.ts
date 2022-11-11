import test from "ava";
import { blockchain } from "@ckb-lumos/base";
import { createParser } from "../src";

test("should parse sample", (t) => {
  const parser = createParser();
  const result = parser.parse(`
    /* Basic Types */
    array Uint8 [byte; 1]; // one byte Uint
  `);
  t.deepEqual(result.Uint8.unpack("0x01"), 1);
});

test("should parse sample wrong refs", (t) => {
  const parser = createParser();
  t.throws(() => {
    parser.parse(
      `
    vector OutPointVec <OutPoint>;
  `,
      { refs: { Script: blockchain.Script } }
    );
  });
});

test("should parse sample with refs", (t) => {
  const parser = createParser();
  const result = parser.parse(
    `
    vector OutPointVec <OutPoint>;
  `,
    { refs: { OutPoint: blockchain.OutPoint }, skipDependenciesCheck: false }
  );
  t.deepEqual(
    result.OutPointVec.unpack(
      "0x01000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a730001000000"
    ),
    [
      {
        txHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
        index: 1,
      },
    ]
  );
});

test("should parse blockchain.mol", (t) => {
  const parser = createParser();
  // https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
  const result = parser.parse(
    `
  /* Basic Types */

  // as a byte array in little endian.
  array Uint8 [byte; 1];
  array Uint16 [byte; 2];
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
  `,
    { refs: {}, skipDependenciesCheck: false }
  );
  t.deepEqual(result.Uint8.unpack("0x01"), 1);
});
