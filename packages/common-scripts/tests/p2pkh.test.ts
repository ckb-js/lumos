import test from "ava";
import { Cell, config, core, helpers, toolkit, utils } from "@ckb-lumos/lumos";
import { default as createKeccak } from "keccak";
import { createP2PKHMessageGroup } from "../src/p2pkh";

const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    OMNI_LOCK: {
      CODE_HASH:
        "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
      HASH_TYPE: "type",
      TX_HASH:
        "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
    PW_LOCK: {
      CODE_HASH:
        "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
      HASH_TYPE: "type",
      TX_HASH:
        "0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
});

test("omni lock [g1]", (t) => {
  let tx = helpers.TransactionSkeleton({});

  const inputCell: Cell = {
    cell_output: {
      capacity: "0xdd305a59c0",
      lock: {
        args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
        code_hash:
          "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
        hash_type: "type" as const,
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      index: "0x1",
      tx_hash:
        "0x99b883d44d1d82e6a612baafc3bdd573a96702a378e52b38b86c11c86413a00f",
    },
    block_number: "0x424da6",
  };
  const outputCell: Cell[] = [
    {
      cell_output: {
        capacity: "0x2540be400",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
    {
      cell_output: {
        capacity: "0xdadc4cef20",
        lock: {
          args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
          code_hash:
            "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
  ];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.OMNI_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.OMNI_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.OMNI_LOCK.DEP_TYPE,
      },
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const SECP_SIGNATURE_PLACEHOLDER = new toolkit.Reader("0x" + "00".repeat(85));
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new toolkit.Reader(
    core.SerializeWitnessArgs(
      toolkit.normalizers.NormalizeWitnessArgs(tmpWitnessArgs)
    )
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) =>
    witnesses.push(tmpWitness, tmpWitness)
  );

  const hasher = new utils.CKBHasher();
  const signLock = {
    args: "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00",
    code_hash:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    hash_type: "type" as const,
  };

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    update: (message) => hasher.update(message),
    digest: () => hasher.digestHex(),
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(
    messageGroup[0].message,
    "0x7080217a60c1f6b7ffd107de07ab3a72b6bce00c22cc0ec2b6244715786dc2ef"
  );
});

test("pw lock [g1]", (t) => {
  let tx = helpers.TransactionSkeleton({});

  const inputCell: Cell = {
    cell_output: {
      capacity: "0xd8884725a0",
      lock: {
        args: "0xa41127471f513ff4c37fc76a46b6e9abd74a590b",
        code_hash:
          "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
        hash_type: "type" as const,
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      index: "0x1",
      tx_hash:
        "0xebd2f47f26630b38f99d078324163ca7fc521955b3e63b23d016d4f52155356c",
    },
    block_number: "0x424cb6",
  };
  const outputCell: Cell[] = [
    {
      cell_output: {
        capacity: "0x2540be400",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
    {
      cell_output: {
        capacity: "0xd63439bb00",
        lock: {
          args: "0xa41127471f513ff4c37fc76a46b6e9abd74a590b",
          code_hash:
            "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
  ];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.PW_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.PW_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.PW_LOCK.DEP_TYPE,
      },
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new toolkit.Reader(
    core.SerializeWitnessArgs(
      toolkit.normalizers.NormalizeWitnessArgs(tmpWitnessArgs)
    )
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) => witnesses.push(tmpWitness));

  const keccak = createKeccak("keccak256");
  const signLock = {
    args: "0xa41127471f513ff4c37fc76a46b6e9abd74a590b",
    code_hash:
      "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
    hash_type: "type" as const,
  };

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    update: (message) => {
      if (typeof message === "string") {
        keccak.update(
          Buffer.from(
            new Uint8Array(
              new toolkit.Reader(message as string).toArrayBuffer()
            )
          )
        );
      } else {
        keccak.update(
          Buffer.from(new Uint8Array(message as ArrayBuffer | Buffer))
        );
      }
    },
    digest: () => "0x" + keccak.digest("hex"),
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(
    messageGroup[0].message,
    "0x96a0c9b667b73ec970f46cd86e44ebac2995dd3d872bcc9822249906e9c9afa1"
  );
});

test("seck256k1 [g1]", (t) => {
  let tx = helpers.TransactionSkeleton({});

  const inputCell: Cell = {
    cell_output: {
      capacity: "0xe68097a560",
      lock: {
        args: "0x7f599d5e44c248e211aa1d1ff47276758cab96f4",
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type" as const,
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      index: "0x1",
      tx_hash:
        "0x62f634d380484b56cee28c166f55ffc562129f0ef5311618396bbb979b806ab5",
    },
    block_number: "0x42516f",
  };
  const outputCell: Cell[] = [
    {
      cell_output: {
        capacity: "0x2540be400",
        lock: {
          args: "0x159890a7cacb44a95bef0743064433d763de229c",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
    {
      cell_output: {
        capacity: "0xe42c8a3ac0",
        lock: {
          args: "0x7f599d5e44c248e211aa1d1ff47276758cab96f4",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type" as const,
        },
      },
      data: "0x",
    },
  ];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
        index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
      },
      dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new toolkit.Reader(
    core.SerializeWitnessArgs(
      toolkit.normalizers.NormalizeWitnessArgs(tmpWitnessArgs)
    )
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) => witnesses.push(tmpWitness));

  const hasher = new utils.CKBHasher();
  const signLock = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as const,
    args: "0x7f599d5e44c248e211aa1d1ff47276758cab96f4",
  };

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    update: (message) => hasher.update(message),
    digest: () => hasher.digestHex(),
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(
    messageGroup[0].message,
    "0x9081f53dba1baaafd15be1f6b85bc3e961babf04b9b190f7960f1b514b506c0b"
  );
});
