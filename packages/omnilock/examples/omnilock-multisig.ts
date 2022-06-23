import { predefined } from "@ckb-lumos/config-manager/src/predefined";
import { createDefaultOmnilockSuite } from "../src/suite";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { key } from "@ckb-lumos/hd";
import {
  createTransactionFromSkeleton,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { BI, Cell, helpers, RPC } from "@ckb-lumos/lumos";
import { AuthByMultiSig } from "../lib/types";

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

const ALICE = {
  PRIVATE_KEY:
    "0x2c56a92a03d767542222432e4f2a0584f01e516311f705041d86b1af7573751f",
  ARGS: "0x3d35d87fac0008ba5b12ee1c599b102fc8f5fdf8",
};

const BOB = {
  PRIVATE_KEY:
    "0x3bc65932a75f76c5b6a04660e4d0b85c2d9b5114efa78e6e5cf7ad0588ca09c8",
  ARGS: "0x99dbe610c43186696e1f88cb7b59252d4c92afda",
};

const CHARLES = {
  PRIVATE_KEY:
    "0xbe06025fbd8c74f65a513a28e62ac56f3227fcb307307a0f2a0ef34d4a66e81f",
  ARGS: "0xc055df68fdd47c6a5965b9ab21cd6825d8696a76",
};

const OMNILOCK_CONFIG: ScriptConfig = {
  CODE_HASH:
    "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
  HASH_TYPE: "type",
  TX_HASH: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
  INDEX: "0x0",
  DEP_TYPE: "code",
};

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
const rpc = new RPC(CKB_RPC_URL);

// transfer 65 CKB from Alice to Bob
async function main() {
  const auth: AuthByMultiSig = {
    authFlag: "MULTISIG",
    options: {
      R: 2,
      M: 3,
      publicKeyHashes: [ALICE.ARGS, BOB.ARGS, CHARLES.ARGS],
    },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_CONFIG,
  });

  const multisigLock = suite.createOmnilockScript({ auth });
  console.log("multisig lock is:", multisigLock);
  console.log(
    "multisig ckb address is:",
    helpers.encodeToAddress(multisigLock, { config: predefined.AGGRON4 })
  );

  const recieverLock = suite.createOmnilockScript({
    auth: {
      authFlag: "SECP256K1_BLAKE160",
      options: {
        pubkeyHash: "0x1234567812345678123456781234567812345678",
      },
    },
  });

  let txSkeleton = TransactionSkeleton({});

  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (let cell of indexer
    .collector({
      lock: multisigLock,
      type: "empty",
      data: "0x",
    })
    .collect()) {
    collectedCells.push(cell);
    collectedSum = collectedSum.add(BI.from(cell.cell_output.capacity));

    if (collectedSum.gt(130_00000000)) break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collectedCells)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    // Alice's cells + Bob's cell
    outputs.push(
      {
        data: "0x",
        cell_output: {
          lock: multisigLock,
          capacity: collectedSum.sub(65_00000000).sub(1000000).toHexString(),
        },
      },
      {
        data: "0x",
        cell_output: {
          lock: recieverLock,
          capacity: BI.from(65_00000000).toHexString(),
        },
      }
    )
  );

  const adjusted = await suite.adjust(txSkeleton);
  txSkeleton = adjusted;

  console.log("adjusted txSkeleton:", txSkeleton.get("witnesses").toJS());

  // txSkeleton = await suite.seal(txSkeleton, (entry) =>
  //   key.signRecoverable(entry.message, ALICE_PRIVKEY)
  // );

  console.log(
    "sealed txSkeleton inputs:",
    JSON.stringify(txSkeleton.get("inputs").toJS())
  );
  console.log("sealed txSkeleton witness:", txSkeleton.get("witnesses").toJS());

  const txHash = await rpc.send_transaction(
    createTransactionFromSkeleton(txSkeleton)
  );
  console.log(txHash);
}

main();
