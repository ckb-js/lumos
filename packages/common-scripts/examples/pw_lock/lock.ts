import { LockScriptInfo, FromInfo, parseFromInfo, common } from "../../src";
import {
  Script,
  CellProvider,
  QueryOptions,
  CellCollector as CellCollectorInterface,
  Cell,
  HexString,
  PackedSince,
  OutPoint,
  values,
  WitnessArgs,
  utils,
  CellDep,
} from "@ckb-lumos/base";
import {
  Options,
  TransactionSkeletonType,
  createTransactionFromSkeleton,
} from "@ckb-lumos/helpers";
import { getConfig, Config, initializeConfig } from "@ckb-lumos/config-manager";
import { Set } from "immutable";
import keccak, { Keccak } from "keccak";

const { ScriptValue } = values;

// https://github.com/lay2dev/pw-lock/commit/b447c2bb3f855e933e36212b45af4dec92adf705 pw-lock is a lock script which uses secp256k1_keccak256 algorithm.

/* 65-byte zeros in hex */
export const SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

function isPwLock(script: Script, config: Config) {
  const template = config.SCRIPTS.PW_LOCK!;
  return script.codeHash === template.CODE_HASH && script.hashType === template.HASH_TYPE;
}

// Help to deal with cell deps, add cell dep to txSkeleton.get("cellDeps") if not exists.
function addCellDep(
  txSkeleton: TransactionSkeletonType,
  newCellDep: CellDep
): TransactionSkeletonType {
  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.depType === newCellDep.depType &&
      new values.OutPointValue(cellDep.outPoint, { validate: false }).equals(
        new values.OutPointValue(newCellDep.outPoint, { validate: false })
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        outPoint: newCellDep.outPoint,
        depType: newCellDep.depType,
      });
    });
  }

  return txSkeleton;
}

// Defined a `CellCollector` class that implements `CellCollectorInterface`.
// `collect` method will collect pw-lock cells.
class CellCollector implements CellCollectorInterface {
  private cellCollector: CellCollectorInterface;
  private config: Config;
  private fromScript: Script;

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config = undefined,
      queryOptions = {},
    }: Options & {
      queryOptions?: QueryOptions;
    }
  ) {
    if (!cellProvider) {
      throw new Error(`Cell provider is missing!`);
    }
    config = config || getConfig();
    this.fromScript = parseFromInfo(fromInfo, { config }).fromScript;
    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    if (!isPwLock(this.fromScript, this.config)) {
      return;
    }

    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
}

// `setupInputCell` accpet a input and transfer this input to an output.
// Then add the input and output to txSkeleton, it should be noted that the output must be added to the end of txSkeleton.get("outputs").
// And this function should also add required cell deps and witnesses.
async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  _fromInfo?: FromInfo,
  {
    config = undefined,
    defaultWitness = "0x",
    since = undefined,
  }: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const fromScript = inputCell.cellOutput.lock;
  if (!isPwLock(fromScript, config)) {
    throw new Error(`Not PW_LOCK input!`);
  }

  // add inputCell to txSkeleton
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(inputCell);
  });

  const output: Cell = {
    cellOutput: {
      capacity: inputCell.cellOutput.capacity,
      lock: inputCell.cellOutput.lock,
      type: inputCell.cellOutput.type,
    },
    data: inputCell.data,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  if (since) {
    txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
      return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
    });
  }

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push(defaultWitness);
  });

  const template = config.SCRIPTS.PW_LOCK;
  if (!template) {
    throw new Error(`PW_LOCK script not defined in config!`);
  }

  const scriptOutPoint: OutPoint = {
    txHash: template.TX_HASH,
    index: template.INDEX,
  };

  // add cell dep
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: scriptOutPoint,
    depType: template.DEP_TYPE,
  });

  // add witness
  /*
   * Modify the skeleton, so the first witness of the fromAddress script group
   * has a WitnessArgs construct with 65-byte zero filled values. While this
   * is not required, it helps in transaction fee estimation.
   */
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
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
      lock: SIGNATURE_PLACEHOLDER,
    };
    if (witness !== "0x") {
      const witnessArgs = new core.WitnessArgs(new Reader(witness));
      const lock = witnessArgs.getLock();
      if (
        lock.hasValue() &&
        new Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock
      ) {
        throw new Error("Lock field in first witness is set aside for signature!");
      }
      const inputType = witnessArgs.getInputType();
      if (inputType.hasValue()) {
        newWitnessArgs.inputType = new Reader(inputType.value().raw()).serializeJson();
      }
      const outputType = witnessArgs.getOutputType();
      if (outputType.hasValue()) {
        newWitnessArgs.outputType = new Reader(outputType.value().raw()).serializeJson();
      }
    }
    witness = new Reader(
      core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(newWitnessArgs))
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
  }

  return txSkeleton;
}

// It's a secp256k1_keccak256 sighash all lock script, so we need a keccak256 hash method.
class Keccak256Hasher {
  private hasher: Keccak;

  constructor() {
    this.hasher = keccak("keccak256");
  }

  update(data: string | ArrayBuffer | Reader): this {
    const reader = new Reader(data);
    const array: Buffer = Buffer.from(reader.serializeJson().slice(2), "hex");
    this.hasher.update(array);
    return this;
  }

  digestReader(): Reader {
    const hex = "0x" + this.hasher.digest("hex").toString();
    return new Reader(hex);
  }

  digestHex() {
    return this.digestReader().serializeJson();
  }
}

function hashWitness(hasher: any, witness: HexString): void {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  const witnessReader = new Reader(witness);
  view.setBigUint64(0, BigInt(witnessReader.length()), true);
  hasher.update(view.buffer);
  hasher.update(witnessReader);
}

// This function help to generate signing messages from pw-lock inputs.
function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();

  const template = config.SCRIPTS.PW_LOCK;
  if (!template) {
    throw new Error(`Provided config does not have PW_LOCK script setup!`);
  }
  let processedArgs = Set<string>();
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = utils
    .ckbHash(core.SerializeRawTransaction(normalizers.NormalizeRawTransaction(tx)))
    .serializeJson();
  const inputs = txSkeleton.get("inputs");
  const witnesses = txSkeleton.get("witnesses");
  let signingEntries = txSkeleton.get("signingEntries");
  for (let i = 0; i < inputs.size; i++) {
    const input = inputs.get(i)!;
    if (
      template.CODE_HASH === input.cellOutput.lock.codeHash &&
      template.HASH_TYPE === input.cellOutput.lock.hashType &&
      !processedArgs.has(input.cellOutput.lock.args)
    ) {
      processedArgs = processedArgs.add(input.cellOutput.lock.args);
      const lockValue = new values.ScriptValue(input.cellOutput.lock, {
        validate: false,
      });
      const hasher = new Keccak256Hasher();
      hasher.update(txHash);
      if (i >= witnesses.size) {
        throw new Error(
          `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`
        );
      }
      hashWitness(hasher, witnesses.get(i)!);
      for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
        const otherInput = inputs.get(j)!;
        if (
          lockValue.equals(
            new values.ScriptValue(otherInput.cellOutput.lock, {
              validate: false,
            })
          )
        ) {
          hashWitness(hasher, witnesses.get(j)!);
        }
      }
      for (let j = inputs.size; j < witnesses.size; j++) {
        hashWitness(hasher, witnesses.get(j)!);
      }
      const hh = new Keccak256Hasher();
      // This magic number is from https://github.com/lay2dev/pw-lock/blob/b447c2bb3f855e933e36212b45af4dec92adf705/c/secp256k1_keccak256_lock.h#L523
      hh.update("0x19457468657265756d205369676e6564204d6573736167653a0a3332");
      hh.update(hasher.digestHex());
      const signingEntry = {
        type: "witness_args_lock",
        index: i,
        message: hh.digestHex(),
      };
      signingEntries = signingEntries.push(signingEntry);
    }
  }
  txSkeleton = txSkeleton.set("signingEntries", signingEntries);
  return txSkeleton;
}

export async function main() {
  // set config
  // deploy your own pw-lock and update config.json
  process.env.LUMOS_CONFIG_FILE = __dirname + "/config.json";
  initializeConfig();

  const config = getConfig();
  const template = config.SCRIPTS.PW_LOCK!;
  // Get a lockScriptInfo and register to common
  // `setupOutputCell` is an optional method, if you only want to add a to output, you can ignore this.
  // `anyone_can_pay` script shows how to use `setupOutputCell`.
  const lockScriptInfo: LockScriptInfo = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    lockScriptInfo: {
      CellCollector,
      setupInputCell,
      prepareSigningEntries,
    },
  };
  common.registerCustomLockScriptInfos([lockScriptInfo]);

  // Then you can use functions like `common.setupInputCell` and `common.transfer` as other lock scripts.
  // Flowing is a example to show how to do.

  // let txSkeleton = TransactionSkeleton({ cellProvider: indexer })
  // const fromScript: Script = {
  //   codeHash: template.CODE_HASH,
  //   hashType: template.HASH_TYPE,
  //   args: pwLockArgs,
  // }
  // const fromAddress = generateAddress(fromScript)

  // const toAddress = "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83"

  // txSkeleton = await common.transfer(
  //   txSkeleton,
  //   [fromAddress],
  //   toAddress,
  //   BigInt(200*10**8),
  // )

  // txSkeleton = common.prepareSigningEntries(txSkeleton)

  // Then sign messages by key pair.
}
