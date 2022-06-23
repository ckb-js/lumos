import { createDefaultOmnilockSuite } from "../src/suite";
import { key } from "@ckb-lumos/hd";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import {
  createTransactionFromSkeleton,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { AuthByP2PKH } from "../src/types";
import { BI, Cell, RPC } from "@ckb-lumos/lumos";

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckbapp.dev/indexer";

const ALICE_PRIVKEY =
  "0x1234567812345678123456781234567812345678123456781234567812345678";

const OMNILOCK_CONFIG: ScriptConfig = {
  CODE_HASH:
    "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
  HASH_TYPE: "type",
  TX_HASH: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
  INDEX: "0x0",
  DEP_TYPE: "code",
};

const pubkeyHash = key.privateKeyToBlake160(ALICE_PRIVKEY);

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
const rpc = new RPC(CKB_RPC_URL);

// transfer 100 CKB from Alice to Bob
async function main() {
  const auth: AuthByP2PKH = {
    authFlag: "SECP256K1_BLAKE160",
    options: { pubkeyHash: pubkeyHash },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_CONFIG,
  });

  const aliceLock = suite.createOmnilockScript({ auth });
  const bobLock = suite.createOmnilockScript({
    auth: {
      authFlag: "SECP256K1_BLAKE160",
      options: {
        pubkeyHash: "0x1234567812345678123456781234567812345678",
      },
    },
  });

  let txSkeleton = new TransactionSkeleton({});

  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (let cell of indexer
    .collector({
      lock: aliceLock,
      type: "empty",
      data: "0x",
    })
    .collect()) {
    collectedCells.push(cell);
    collectedSum = collectedSum.add(BI.from(cell.cell_output.capacity));

    if (collectedSum.gt(200_00000000)) break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collectedCells)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    // Alice's cells + Bob's cell
    outputs.push(...collectedCells, {
      data: "0x",
      cell_output: {
        lock: bobLock,
        capacity: BI.from(100_00000000).toHexString(),
      },
    })
  );

  const adjusted = await suite.adjust(txSkeleton);
  txSkeleton = adjusted;

  // txSkeleton = await commons.common.payFeeByFeeRate(
  //   txSkeleton,
  //   [{ script: aliceLock, customData: "0x" }],
  //   1000,
  //   undefined,
  //   {
  //     config: predefined.AGGRON4,
  //   }
  // );
  txSkeleton = await suite.seal(txSkeleton, (entry) =>
    key.signRecoverable(entry.message, ALICE_PRIVKEY)
  );

  // for a mixed case
  // txSkeleton = await suite.seal(txSkeleton, (entry) => {
  //   const authFlag = entry.authHint.authFlag;
  //   if (authFlag === "ETHEREUM") {
  //     return signViaEthereum(entry.message);
  //   }
  //   if (authFlag === "SECP256K1_BLAKE160") {
  //     return key.signRecoverable(entry.message, ALICE_PRIVKEY);
  //   }
  //
  //   throw new Error("unsupported auth flag");
  // });

  const txHash = await rpc.send_transaction(
    createTransactionFromSkeleton(txSkeleton)
  );
  console.log(txHash);
}

main();
