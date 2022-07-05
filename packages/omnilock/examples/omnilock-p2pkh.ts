import { predefined } from "./../../config-manager/src/predefined";
import { createDefaultOmnilockSuite } from "../src/suite";
import { key } from "@ckb-lumos/hd";
import { initializeConfig, ScriptConfig } from "@ckb-lumos/config-manager";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import {
  createTransactionFromSkeleton,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { AuthByP2PKH } from "../src/types";
import { BI, Cell, helpers, RPC } from "@ckb-lumos/lumos";

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

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
const rpc = new RPC(CKB_RPC_URL);

// transfer 65 CKB from Alice to Bob
async function main() {
  initializeConfig(predefined.AGGRON4);
  const aliceAddress = key.privateKeyToBlake160(ALICE_PRIVKEY);
  console.log("alice eth address is:", aliceAddress);

  const auth: AuthByP2PKH = {
    authFlag: "SECP256K1_BLAKE160",
    options: { pubkeyHash: aliceAddress },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_CONFIG,
  });

  const aliceLock = suite.createOmnilockScript({ auth });
  console.log("alice lock is:", aliceLock);
  console.log(
    "alice ckb address is:",
    helpers.encodeToAddress(aliceLock, { config: predefined.AGGRON4 })
  );

  const bobLock = suite.createOmnilockScript({
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
      lock: aliceLock,
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
          lock: aliceLock,
          capacity: collectedSum.sub(65_00000000).sub(1000000).toHexString(),
        },
      },
      {
        data: "0x",
        cell_output: {
          lock: bobLock,
          capacity: BI.from(65_00000000).toHexString(),
        },
      }
    )
  );

  const { adjusted } = await suite.adjust(txSkeleton);
  txSkeleton = adjusted;

  console.log("adjusted txSkeleton:", txSkeleton.get("witnesses").toJS());

  txSkeleton = await suite.seal(txSkeleton, (entry) =>
    key.signRecoverable(entry.message, ALICE_PRIVKEY)
  );

  console.log(
    "sealed txSkeleton inputs:",
    JSON.stringify(txSkeleton.get("inputs").toJS())
  );
  console.log("sealed txSkeleton witness:", txSkeleton.get("witnesses").toJS());

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

// 0x690000001000000069000000690000005500000055000000100000005500000055000000410000007ed09c5e12b50f65c199b2f3d4f0330372e43344eb58ebc20a50b62ed94520ea364657dc7a978c99a1ec5160e1998b42802e61bec39a68c1344a285f39c651bf01
// 0x690000001000000069000000690000005500000055000000100000005500000055000000410000001a7f3753e70ab16d27f46d772f1e89f46edf92d9dab162a99168fc62d4ed360a09d404805dc3bd1bb484aa1555b523b0e39952715a67aa5426434fecc897df4301
