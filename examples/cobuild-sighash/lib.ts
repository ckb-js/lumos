import { BI, helpers, Indexer, RPC, config, Cell, CellDep, Script } from "@ckb-lumos/lumos";
import { Config } from "@ckb-lumos/lumos/config";
import { addCellDep, minimalCellCapacityCompatible, TransactionSkeleton } from "@ckb-lumos/lumos/helpers";
import { computeScriptHash } from "@ckb-lumos/lumos/utils";
import { AnyCodec, blockchain, bytes, table, Uint128, union, UnpackResult } from "@ckb-lumos/lumos/codec";
import { injectCapacity, payFee } from "@ckb-lumos/lumos/common-scripts/common";
import { prepareCobuildSighashSigningEntries, sealTransaction } from "@ckb-lumos/cobuild";
import { cobuild } from "@ckb-lumos/lumos/common-scripts/omnilock";

export const CONFIG: Config = {
  PREFIX: config.TESTNET.PREFIX,
  SCRIPTS: {
    ...config.TESTNET.SCRIPTS,
    // TODO remove it when the testnet omnilock is updated
    OMNILOCK: {
      TX_HASH: "0x042485f2b1386f3156a1585de6fe38e3c866ffb5acbcea6cab61a37b9780e7b1",
      HASH_TYPE: "type",
      CODE_HASH: "0xc039461134d79c87929eca28cb89261ec3f66cc2b5f562063da863330870598b",
      DEP_TYPE: "code",
      INDEX: "0x0",
    },
  },
};

config.initializeConfig(CONFIG);

/**
 * a helper function to enhance readability for the unpacked result of codecs
 * @param original
 * @param enhance
 */
function readable<T extends AnyCodec>(original: T, enhance: (value: UnpackResult<T>) => any): AnyCodec {
  return {
    ...original,
    unpack: (value) => enhance(original.unpack(value)),
  };
}

const ReadableScript = readable(blockchain.Script, (script: Script) => helpers.encodeToAddress(script));
const ReadableU128 = readable(Uint128, (value) => value.toString());

// fake udt mint action
const MintUdt = table({ amount: ReadableU128, to: ReadableScript }, ["amount", "to"]);
// a fake schema, just for demonstration
// please do NOT use it in the real world sUDT
const FakeScheme = union({ MintUdt }, ["MintUdt"]);

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

export async function mintSudt(options: Options): Promise<string> {
  let txSkeleton = TransactionSkeleton({
    cellProvider: { collector: (query) => indexer.collector({ type: "empty", ...query }) },
  });

  const udtType: Script = {
    codeHash: CONFIG.SCRIPTS.SUDT.CODE_HASH,
    hashType: CONFIG.SCRIPTS.SUDT.HASH_TYPE,
    args: computeScriptHash(helpers.parseAddress(options.from)),
  };
  const toLock = helpers.parseAddress(options.to);

  const message = {
    actions: [
      {
        data: FakeScheme.pack({ type: "MintUdt", value: { amount: Number(options.amount), to: toLock } }),
        scriptHash: computeScriptHash(udtType),
        scriptInfoHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
    ],
  };

  const approved = window.confirm(
    `You are going to send the message to blockchain \n ${JSON.stringify(
      FakeScheme.unpack(message.actions[0].data),
      null,
      2
    )}`
  );

  if (!approved) {
    throw new Error("User has rejected");
  }

  const udtCell: Cell = {
    cellOutput: { capacity: "0x0", lock: toLock, type: udtType },
    data: bytes.hexify(Uint128.pack(Number(options.amount))),
  };
  const sudtOccupied = minimalCellCapacityCompatible(udtCell);
  udtCell.cellOutput.capacity = sudtOccupied.toHexString();

  txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(udtCell));

  const sudtCellDep: CellDep = {
    outPoint: { txHash: CONFIG.SCRIPTS.SUDT.TX_HASH, index: CONFIG.SCRIPTS.SUDT.INDEX },
    depType: CONFIG.SCRIPTS.SUDT.DEP_TYPE,
  };
  txSkeleton = addCellDep(txSkeleton, sudtCellDep);

  txSkeleton = await injectCapacity(txSkeleton, [options.from], sudtOccupied);
  // TODO a better way for fee calculation
  txSkeleton = await payFee(txSkeleton, [options.from], 2000);

  txSkeleton = prepareCobuildSighashSigningEntries(
    txSkeleton,
    // only one omnilock in the transaction
    // so we can use a simple filter
    () => true,
    message
  );

  let signature = await ethereum.request({
    method: "personal_sign",
    params: [ethereum.selectedAddress, txSkeleton.signingEntries.get(0).message],
  });
  let v = Number.parseInt(signature.slice(-2), 16);
  if (v >= 27) v -= 27;
  signature = "0x" + signature.slice(2, -2) + v.toString(16).padStart(2, "0");

  const signedTx = sealTransaction(txSkeleton, [cobuild.sealCobuildBlake2bFlow({ signature })], message);
  const txHash = await rpc.sendTransaction(signedTx);

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
