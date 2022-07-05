import { BI, Cell, config, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { createDefaultOmnilockSuite, signViaEthereum } from "@ckb-lumos/omnilock";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { parseAddress, TransactionSkeleton } from "@ckb-lumos/helpers";
import { AuthByP2PKH } from "@ckb-lumos/omnilock/lib/types";

const OMNILOCK_SCRIPT_CONFIG: ScriptConfig = {
  CODE_HASH: "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
  HASH_TYPE: "type",
  TX_HASH: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
  INDEX: "0x0",
  DEP_TYPE: "code",
};

export const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    OMNI_LOCK: OMNILOCK_SCRIPT_CONFIG,
  },
});

config.initializeConfig(CONFIG);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Options {
  // from eth address
  from: string;
  // to ckb address
  to: string;
  amount: string;
}

// @ts-ignore
export const ethereum = window.ethereum as EthereumProvider;

export async function transfer(options: Options): Promise<string> {
  const auth: AuthByP2PKH = {
    authFlag: "ETHEREUM",
    options: { pubkeyHash: options.from },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_SCRIPT_CONFIG,
  });

  const fromLock = suite.createOmnilockScript({ auth });

  const toLock = parseAddress(options.to)

  const amountInShannons = BI.from(options.amount)
  let txSkeleton = TransactionSkeleton({});

  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (let cell of indexer
    .collector({
      lock: fromLock,
      type: "empty",
      data: "0x",
    })
    .collect()) {
    collectedCells.push(cell);
    collectedSum = collectedSum.add(BI.from(cell.cell_output.capacity));
    if (collectedSum.gt(amountInShannons)) break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collectedCells)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(
      {
        data: "0x",
        cell_output: {
          lock: fromLock,
          capacity: collectedSum.sub(amountInShannons).sub(100000).toHexString(),
        },
      },
      {
        data: "0x",
        cell_output: {
          lock: toLock,
          capacity: BI.from(amountInShannons).toHexString(),
        },
      }
    )
  );

  const { adjusted } = await suite.adjust(txSkeleton);
  txSkeleton = adjusted;

  txSkeleton = await suite.seal(txSkeleton, (entry) =>
    signViaEthereum(entry.message)
  );

  const txHash = await rpc.send_transaction(
    helpers.createTransactionFromSkeleton(txSkeleton),  "passthrough"
  );
  
  return txHash
}

export async function capacityOf(address: string): Promise<BI> {
  const auth: AuthByP2PKH = {
    authFlag: "ETHEREUM",
    options: { pubkeyHash: address },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: OMNILOCK_SCRIPT_CONFIG,
  });

  const userOmniLock = suite.createOmnilockScript({ auth });

  const collector = indexer.collector({
    lock: userOmniLock,
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cell_output.capacity);
  }

  return balance;
}
