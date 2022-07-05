import { BI, commons, config, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { OmnilockWitnessLock, signViaEthereum } from "@ckb-lumos/omnilock";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { sealTransaction } from "@ckb-lumos/helpers";
import { hexify } from "@ckb-lumos/codec/lib/bytes";

const { common } = commons;

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

// const adapter = createCommonAdapter({ scriptConfig: OMNILOCK_SCRIPT_CONFIG });
// common.registerCustomLockScriptInfos([adapter.adapt()]);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Options {
  from: string;
  to: string;
  amount: string;
}

export async function transfer(options: Options): Promise<string> {
  let txSkeleton = helpers.TransactionSkeleton({
    cellProvider: {
      collector(options) {
        return indexer.collector(options);
      },
    },
  });

  txSkeleton = await common.transfer(txSkeleton, [options.from], options.to, options.amount, undefined, undefined, {
    config: CONFIG,
  });
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [options.from], 1000, undefined, { config: CONFIG });
  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: CONFIG });

  const signedMessage = await Promise.all(
    txSkeleton
      .get("signingEntries")
      .map((entry) => signViaEthereum(entry.message))
      .toArray()
  );

  const seal = hexify(OmnilockWitnessLock.pack({ signature: signedMessage[0] }));

  const tx = sealTransaction(txSkeleton, [seal]);
  return rpc.send_transaction(tx, "passthrough");
}

export async function capacityOf(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cell_output.capacity);
  }

  return balance;
}
