// payFeeByFeeRate
import {
  Indexer,
  helpers,
  Address,
  Script,
  RPC,
  hd,
  config,
  Cell,
  commons,
  core,
  WitnessArgs,
  toolkit,
  BI,
} from "@ckb-lumos/lumos";
import { BIish } from "@ckb-lumos/bi";
import { values } from "@ckb-lumos/base";
import { payFeeByFeeRate } from "@ckb-lumos/common-scripts/lib/common";
const { ScriptValue } = values;

export const { AGGRON4 } = config.predefined;

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

type Account = {
  lockScript: Script;
  address: Address;
  pubKey: string;
};

export const generateAccountFromPrivateKey = (privKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: args,
  };
  const address = helpers.generateAddress(lockScript, { config: AGGRON4 });
  return {
    lockScript,
    address,
    pubKey,
  };
};

export async function capacityOf(address: string): Promise<BI> {
  let balance = BI.from(0);
  const cells = await collectInputCells(address);

  for await (const cell of cells) {
    balance = balance.add(cell.cell_output.capacity);
  }

  return balance;
}

export async function collectInputCells(address: string, capacityLimit?: BIish): Promise<Cell[]> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address, { config: AGGRON4 }),
  });

  const cells: Cell[] = [];
  let total = BI.from(0);

  for await (const cell of collector.collect()) {
    if (capacityLimit) {
      if (total.gt(capacityLimit)) {
        break;
      } else {
        total = total.add(cell.cell_output.capacity);
      }
    }
    cells.push(cell);
  }

  return cells;
}

export interface Options {
  from: string;
  to: {
    address: string;
    amount: BIish;
  }[];
  privKey: string;
}

export async function createTxSkeleton(options: Options) {
  const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });
  const totalOutputs = options.to.reduce((prev, cur) => prev.add(cur.amount), BI.from(0));
  const inputCells = await collectInputCells(options.from, totalOutputs);
  const totalInputs = inputCells.reduce((prev, cur) => prev.add(cur.cell_output.capacity), BI.from(0));
  const transferOutput: Cell[] = options.to.map((target) => ({
    cell_output: {
      capacity: BI.from(target.amount).toHexString(),
      lock: helpers.parseAddress(target.address, { config: AGGRON4 }),
    },
    data: "0x",
  }));
  const changeOutput: Cell = {
    cell_output: {
      capacity: totalInputs.sub(totalOutputs).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  let txSkeleton = helpers
    .TransactionSkeleton({ cellProvider: indexer })
    .update("inputs", (inputs) => inputs.push(...inputCells))
    .update("outputs", (outputs) => outputs.push(...transferOutput, changeOutput))
    .update("cellDeps", (cellDeps) =>
      cellDeps.push({
        out_point: {
          tx_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      })
    )
    .update("witnesses", (witnesses) => {
      const dummyWitness = {
        lock: new toolkit.Reader(
          "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        ).toArrayBuffer(),
      };

      const witnessArgs = new toolkit.Reader(core.SerializeWitnessArgs(dummyWitness)).serializeJson();
      return witnesses.push(witnessArgs);
    });

  txSkeleton = await payFeeByFeeRate(txSkeleton, [options.from], 1000, undefined, { config: AGGRON4 });
  console.log(txSkeleton.toJS());
  return txSkeleton;
}

export async function transfer(options: Options): Promise<string> {
  const fromScript = helpers.parseAddress(options.from, { config: AGGRON4 });
  let txSkeleton = await createTxSkeleton(options);
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock:
        "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    };
    if (witness !== "0x") {
      const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
      const lock = witnessArgs.getLock();
      if (lock.hasValue() && new toolkit.Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock) {
        throw new Error("Lock field in first witness is set aside for signature!");
      }
      const inputType = witnessArgs.getInputType();
      if (inputType.hasValue()) {
        newWitnessArgs.input_type = new toolkit.Reader(inputType.value().raw()).serializeJson();
      }
      const outputType = witnessArgs.getOutputType();
      if (outputType.hasValue()) {
        newWitnessArgs.output_type = new toolkit.Reader(outputType.value().raw()).serializeJson();
      }
    }
    witness = new toolkit.Reader(
      core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
  }

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, options.privKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);
  const hash = await rpc.send_transaction(tx, "passthrough");
  console.log("The transaction hash is", hash);

  return hash;
}
