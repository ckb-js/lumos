import { blockchain, bytes } from '@ckb-lumos/codec';
import { BI, Cell, config, helpers, RPC, commons, Indexer as CkbIndexer } from "@ckb-lumos/lumos";
import {
  COSESign1Builder,
  HeaderMap,
  Label,
  AlgorithmId,
  CBORValue,
  Headers,
  ProtectedHeaderMap,
  COSESign1,
  COSEKey,
  BigNum,
  Int,
} from "@emurgo/cardano-message-signing-asmjs";
import { SerializeCardanoWitnessLock } from "./generated/cardano";

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
const indexer = new CkbIndexer(CKB_INDEXER_URL, CKB_RPC_URL);

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
    cellDeps.push({
      outPoint: {
        txHash: CONFIG.SCRIPTS.CARDANO_LOCK.TX_HASH,
        index: CONFIG.SCRIPTS.CARDANO_LOCK.INDEX,
      },
      depType: CONFIG.SCRIPTS.CARDANO_LOCK.DEP_TYPE,
    })
  );

  const protectedHeaders = HeaderMap.new();
  protectedHeaders.set_algorithm_id(Label.from_algorithm_id(AlgorithmId.EdDSA));
  // protectedHeaders.set_key_id(publicKey.as_bytes());
  protectedHeaders.set_header(Label.new_text("address"), CBORValue.new_bytes(Buffer.from(options.cardanoAddr, "hex")));
  const protectedSerialized = ProtectedHeaderMap.new(protectedHeaders);
  const unprotectedHeaders = HeaderMap.new();
  const headers = Headers.new(protectedSerialized, unprotectedHeaders);

  const payload = "00".repeat(32);
  let builder = COSESign1Builder.new(headers, Buffer.from(payload, "hex"), false);
  let toSign = builder.make_data_to_sign().to_bytes();

  const placeHolder = (
    "0x" +
      "00".repeat(
        SerializeCardanoWitnessLock({
          pubkey: new Uint8Array(32),
          signature: new Uint8Array(64),
          sig_structure: toSign.buffer,
        }).byteLength
      )
  );

  const tmpWitnessArgs = blockchain.WitnessArgs.pack({ lock: placeHolder });
  const witness = bytes.hexify(tmpWitnessArgs);

  for (let i = 0; i < tx.inputs.toArray().length; i++) {
    tx = tx.update("witnesses", (witnesses) => witnesses.push(witness));
  }

  const signLock = tx.inputs.get(0)?.cellOutput.lock!;
  const messageGroup = commons.createP2PKHMessageGroup(tx, [signLock]);
  const messageForSigning = messageGroup[0].message.slice(2);

  builder = COSESign1Builder.new(headers, Buffer.from(messageForSigning, "hex"), false);
  toSign = builder.make_data_to_sign().to_bytes(); // sig_structure

  const signedRes = await options.api.signData(options.cardanoAddr, messageForSigning);
  const signedSignature = signedRes.signature;

  const COSESignature = COSESign1.from_bytes(Buffer.from(signedSignature, "hex"));

  const signedKey = COSEKey.from_bytes(Buffer.from(signedRes.key, "hex"));
  const label = Label.new_int(Int.new_negative(BigNum.from_str("2")));
  const CBORPubkey = signedKey.header(label)!;

  const signedWitnessArgs = bytes.hexify(
    SerializeCardanoWitnessLock({
      pubkey: CBORPubkey.as_bytes()!.buffer,
      signature: COSESignature.signature().buffer,
      sig_structure: toSign.buffer,
    })
  );

  const signedWitness = bytes.hexify(blockchain.WitnessArgs.pack({ lock: signedWitnessArgs }))
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
