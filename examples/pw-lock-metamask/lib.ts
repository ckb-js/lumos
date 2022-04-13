import { BI, Cell, config, core, helpers, Indexer, RPC, toolkit, commons } from "@ckb-lumos/lumos";
import { default as createKeccak } from "keccak";

export const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    // https://github.com/lay2dev/pw-core/blob/861310b3dd8638f668db1a08d4c627db4c34d815/src/constants.ts#L156-L169
    PW_LOCK: {
      CODE_HASH: "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
      HASH_TYPE: "type",
      TX_HASH: "0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38",
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

// prettier-ignore
interface EthereumRpc {
    (payload: { method: 'personal_sign'; params: [string /*from*/, string /*message*/] }): Promise<string>;
}

// prettier-ignore
export interface EthereumProvider {
    selectedAddress: string;
    isMetaMask?: boolean;
    enable: () => Promise<string[]>;
    addListener: (event: 'accountsChanged', listener: (addresses: string[]) => void) => void;
    removeEventListener: (event: 'accountsChanged', listener: (addresses: string[]) => void) => void;
    request: EthereumRpc;
}

// @ts-ignore
export const ethereum = window.ethereum as EthereumProvider;

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Options {
  from: string;
  to: string;
  amount: string;
}

export async function transfer(options: Options): Promise<string> {
  let tx = helpers.TransactionSkeleton({});
  const fromScript = helpers.parseAddress(options.from);
  const toScript = helpers.parseAddress(options.to);

  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BI.from(options.amount).add(100000);
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
    cellDeps.push(
      // pw-lock dep
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.PW_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.PW_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.PW_LOCK.DEP_TYPE,
      },
      // pw-lock is dependent on secp256k1
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const messageForSigning = (() => {
    const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
    const newWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
    const witness = new toolkit.Reader(
      core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
    ).serializeJson();

    // fill txSkeleton's witness with 0
    for (let i = 0; i < tx.inputs.toArray().length; i++) {
      tx = tx.update("witnesses", (witnesses) => witnesses.push(witness));
    }

    // locks you want to sign
    const signLock = tx.inputs.get(0)?.cell_output.lock!;

    // just like P2PKH
    // https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction
    const keccak = createKeccak("keccak256");

    const messageGroup = commons.createP2PKHMessageGroup(tx, [signLock], {
      hasher: {
        update: (message) => keccak.update(Buffer.from(new Uint8Array(message))),
        digest: () => keccak.digest(),
      },
    });

    return messageGroup[0];
  })();

  let signedMessage = await ethereum.request({
    method: "personal_sign",
    params: [ethereum.selectedAddress, messageForSigning.message],
  });

  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");

  const signedWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: new toolkit.Reader(signedMessage),
    })
  ).serializeJson();

  tx = tx.update("witnesses", (witnesses) => witnesses.set(0, signedWitness));

  const signedTx = helpers.createTransactionFromSkeleton(tx);
  const txHash = await rpc.send_transaction(signedTx, "passthrough");

  return txHash;
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
