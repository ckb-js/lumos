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
} from "@ckb-lumos/lumos";
import { values } from "@ckb-lumos/base";
import { serializeMultisigScript, multisigArgs, FromInfo, parseFromInfo, MultisigScript } from "@ckb-lumos/common-scripts/lib/from_info";
const { ScriptValue } = values;

export const { AGGRON4 } = config.predefined;

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

// config.initializeConfig(config.predefined.AGGRON4);

// const script = helpers.parseAddress(
//   "ckt1qyq76g90wv3gy0gdcvalkg25s6s9pqnxnyzsym7kjc"
// );
// console.log("script", script);

// config.initializeConfig({
//   ...config.predefined.AGGRON4,
//   SCRIPTS: {
//     ...config.predefined.AGGRON4.SCRIPTS,
//     SECP256K1_BLAKE160_MULTISIG: {
//       ...config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG,
//       SHORT_ID: undefined,
//     },
//   },
// });
// console.log(helpers.generateAddress(script));

const fromInfo: FromInfo = {
  R: 2,
  M: 2,
  publicKeyHashes: [
    "0x3d35d87fac0008ba5b12ee1c599b102fc8f5fdf8", //Lock Arg of Alice
    "0x99dbe610c43186696e1f88cb7b59252d4c92afda", // Lock Arg of Bob
    "0xc055df68fdd47c6a5965b9ab21cd6825d8696a76",
  ],
};
let fromScript: Script;
let multisigScript: string;

type Account = {
  lockScript: Script;
  address: Address;
};
export const generateAccountFromPrivateKey = (): Account => {
  multisigScript = serializeMultisigScript(fromInfo);
  const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);

  const template = AGGRON4.SCRIPTS["SECP256K1_BLAKE160_MULTISIG"]!;
  const lockScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: fromScriptArgs,
  };
  fromScript = lockScript;
  const address = helpers.generateAddress(lockScript, { config: AGGRON4 });
  return {
    lockScript,
    address,
  };
};

interface Options {
  to: string;
  amount: string;
  privKeys: string[];
}

export async function transfer(options: Options): Promise<string> {
  let txSkeleton = helpers.TransactionSkeleton({});
  // const { fromScript, multisigScript } = parseFromInfo(fromInfo, { config: AGGRON4 });

  const toScript = helpers.parseAddress(options.to, { config: AGGRON4 });

  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BigInt(options.amount) + 0_00100000n;
  let collectedSum = 0n;
  const collected: Cell[] = [];
  const collector = indexer.collector({ lock: fromScript, type: "empty" });
  for await (const cell of collector.collect()) {
    collectedSum += BigInt(cell.cell_output.capacity);
    collected.push(cell);
    if (collectedSum >= neededCapacity) break;
  }

  if (collectedSum < neededCapacity) {
    throw new Error("Not enough CKB");
  }

  const transferOutput: Cell = {
    cell_output: {
      capacity: "0x" + BigInt(options.amount).toString(16),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cell_output: {
      capacity: "0x" + BigInt(collectedSum - neededCapacity).toString(16),
      lock: fromScript,
    },
    data: "0x",
  };

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collected)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(transferOutput, changeOutput)
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.TX_HASH,
        index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.INDEX,
      },
      dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.DEP_TYPE,
    })
  );

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    let newWitnessArgs: WitnessArgs;
    const SECP_SIGNATURE_PLACEHOLDER = "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    if (typeof fromInfo !== "string") {
      newWitnessArgs = {
        lock:
          "0x" +
          multisigScript!.slice(2) +
          SECP_SIGNATURE_PLACEHOLDER.slice(2).repeat(
            (fromInfo as MultisigScript).M
          ),
      }
    } else {
      newWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
    }
    if (witness !== "0x") {
      const witnessArgs = new core.WitnessArgs(new toolkit.Reader(witness));
      const lock = witnessArgs.getLock();
      if (
        lock.hasValue() &&
        new toolkit.Reader(lock.value().raw()).serializeJson() !==
          newWitnessArgs.lock
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.getInputType();
      if (inputType.hasValue()) {
        newWitnessArgs.input_type = new toolkit.Reader(
          inputType.value().raw()
        ).serializeJson();
      }
      const outputType = witnessArgs.getOutputType();
      if (outputType.hasValue()) {
        newWitnessArgs.output_type = new toolkit.Reader(
          outputType.value().raw()
        ).serializeJson();
      }
    }
    witness = new toolkit.Reader(
      core.SerializeWitnessArgs(
        toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs)
      )
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  let Sigs: string = "";
  options.privKeys.forEach((privKey) => {
    if (privKey !== "") {
      let sig = hd.key.signRecoverable(message!, privKey);
      sig = sig.slice(2)
      Sigs += sig;
    }
  })
  Sigs = "0x000202033d35d87fac0008ba5b12ee1c599b102fc8f5fdf899dbe610c43186696e1f88cb7b59252d4c92afdac055df68fdd47c6a5965b9ab21cd6825d8696a76" + Sigs;
  
  const tx = helpers.sealTransaction(txSkeleton, [Sigs]);
  const hash = await rpc.send_transaction(tx, "passthrough");
  console.log("The transaction hash is", hash);

  return hash;
}
