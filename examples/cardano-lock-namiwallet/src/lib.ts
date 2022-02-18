import { BI, Cell, config, core, helpers, Indexer, RPC, toolkit, utils } from "@ckb-lumos/lumos";

export const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    CARDANO_LOCK: {
      CODE_HASH: "0x3625f5ccecdbb8edff6890db2225b0218d753b7932e144a41b0a77b1111c921b",
      HASH_TYPE: "type",
      TX_HASH: "0xadf72b5a58b18e3763ab9e7769e16ffcb222da07a2cae2b407a6ffc47a2d39ff",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
});

config.initializeConfig(CONFIG);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export interface Cardano {
  nami: {
    enable: () => Promise<CIP30FullAPI>;
  };
}
export interface CIP30FullAPI {
  getUsedAddresses: () => Promise<string[]>;
  signData: (address: string, message: string) => Promise<{ signature: string; key: string }>;
}

declare global {
  interface Window {
    cardano: Cardano;
  }
}

export async function detectCardano(): Promise<Cardano> {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > 5000) {
      throw new Error("It seems you dont have NamiWallet installed");
    }
    if (window.cardano) return window.cardano;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

interface Options {
  from: string;
  to: string;
  amount: string;
  api: CIP30FullAPI;
  cardanoAddr: string;
}

export async function transfer(options: Options): Promise<string> {
  let tx = helpers.TransactionSkeleton({});
  const fromScript = helpers.parseAddress(options.from);
  const toScript = helpers.parseAddress(options.to);

  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BI.from(options.amount).add("100000");
  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  const collector = indexer.collector({ lock: fromScript, type: "empty" });
  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cell_output.capacity);
    collectedCells.push(cell);
    if (BI.from(collectedSum).gte(neededCapacity)) break;
  }

  if (collectedSum.lt(neededCapacity)) {
    throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `);
  }

  const transferOutput: Cell = {
    cell_output: {
      capacity: BI.from(options.amount).toHexString(),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cell_output: {
      capacity: collectedSum.sub(neededCapacity).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  tx = tx.update("inputs", (inputs) => inputs.push(...collectedCells));
  tx = tx.update("outputs", (outputs) => outputs.push(transferOutput, changeOutput));
  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: CONFIG.SCRIPTS.CARDANO_LOCK.TX_HASH,
        index: CONFIG.SCRIPTS.CARDANO_LOCK.INDEX,
      },
      dep_type: CONFIG.SCRIPTS.CARDANO_LOCK.DEP_TYPE,
    })
  );

  const payload = "00".repeat(32);
  let tmpWitness = (await options.api.signData(options.cardanoAddr, payload)).signature;
  tmpWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: new toolkit.Reader("0x" + tmpWitness),
    })
  ).serializeJson();

  const hasher = new utils.CKBHasher();
  const rawTxHash = utils.ckbHash(
    core.SerializeRawTransaction(toolkit.normalizers.NormalizeRawTransaction(helpers.createTransactionFromSkeleton(tx)))
  );
  hasher.update(rawTxHash);

  const SECP_SIGNATURE_PLACEHOLDER = new toolkit.Reader("0x" + "00".repeat(tmpWitness.length - 20));
  const newWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const witness = core.SerializeWitnessArgs(newWitnessArgs);

  hashWitness(hasher, witness);
  const messageForSigning = hasher.digestHex();

  const signedRes = await options.api.signData(options.cardanoAddr, messageForSigning.slice(2));
  const signedMessage = signedRes.signature;

  const signedWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: new toolkit.Reader("0x" + signedMessage),
    })
  ).serializeJson();

  tx = tx.update("witnesses", (witnesses) => witnesses.push(signedWitness));

  const signedTx = helpers.createTransactionFromSkeleton(tx);
  const txHash = await rpc.send_transaction(signedTx, "passthrough");

  return txHash;
}

function hashWitness(hasher: utils.CKBHasher, witness: ArrayBuffer): void {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  view.setBigUint64(0, BigInt(new toolkit.Reader(witness).length()), true);

  hasher.update(lengthBuffer);
  hasher.update(witness);
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
