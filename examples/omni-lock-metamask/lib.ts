import { bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { BI, Cell, helpers, Indexer, RPC, config, commons } from "@ckb-lumos/lumos";
const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_RPC_URL);
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
const SECP_SIGNATURE_PLACEHOLDER = bytes.hexify(
  new Uint8Array(
    commons.omnilock.OmnilockWitnessLock.pack({
      signature: new Uint8Array(65).buffer,
    }).byteLength
  )
);

export async function transfer(options: Options): Promise<string> {
  const CONFIG = config.getConfig();
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
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
    collectedCells.push(cell);
    if (BI.from(collectedSum).gte(neededCapacity)) break;
  }

  if (collectedSum.lt(neededCapacity)) {
    throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `);
  }

  const transferOutput: Cell = {
    cellOutput: {
      capacity: BI.from(options.amount).toHexString(),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cellOutput: {
      capacity: collectedSum.sub(neededCapacity).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  tx = tx.update("inputs", (inputs) => inputs.push(...collectedCells));
  tx = tx.update("outputs", (outputs) => outputs.push(transferOutput, changeOutput));
  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      // omni lock dep
      {
        outPoint: {
          txHash: CONFIG.SCRIPTS.OMNILOCK.TX_HASH,
          index: CONFIG.SCRIPTS.OMNILOCK.INDEX,
        },
        depType: CONFIG.SCRIPTS.OMNILOCK.DEP_TYPE,
      },
      // SECP256K1 lock is depended by omni lock
      {
        outPoint: {
          txHash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        depType: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const witness = bytes.hexify(blockchain.WitnessArgs.pack({ lock: SECP_SIGNATURE_PLACEHOLDER }));

  // fill txSkeleton's witness with placeholder
  for (let i = 0; i < tx.inputs.toArray().length; i++) {
    tx = tx.update("witnesses", (witnesses) => witnesses.push(witness));
  }

  tx = commons.omnilock.prepareSigningEntries(tx, { config: CONFIG });

  let signedMessage = await ethereum.request({
    method: "personal_sign",
    params: [ethereum.selectedAddress, tx.signingEntries.get(0).message],
  });

  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");

  const signedWitness = bytes.hexify(
    blockchain.WitnessArgs.pack({
      lock: commons.omnilock.OmnilockWitnessLock.pack({
        signature: bytes.bytify(signedMessage).buffer,
      }),
    })
  );

  tx = tx.update("witnesses", (witnesses) => witnesses.set(0, signedWitness));

  const signedTx = helpers.createTransactionFromSkeleton(tx);
  const txHash = await rpc.sendTransaction(signedTx, "passthrough");

  return txHash;
}

export async function capacityOf(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}
