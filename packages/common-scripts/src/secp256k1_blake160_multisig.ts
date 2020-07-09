import {
  parseAddress,
  minimalCellCapacity,
  createTransactionFromSkeleton,
  generateAddress,
  TransactionSkeletonType,
  Options,
} from "@ckb-lumos/helpers";
import {
  core,
  values,
  utils,
  HexString,
  Script,
  Hash,
  PackedSince,
  Address,
  OutPoint,
  Cell,
  WitnessArgs,
} from "@ckb-lumos/base";
const { CKBHasher, ckbHash, toBigUInt64LE } = utils;
import { getConfig, Config } from "@ckb-lumos/config-manager";
const { ScriptValue } = values;
import { normalizers, Reader } from "ckb-js-toolkit";
import { Set } from "immutable";

/**
 * secp256k1_blake160_multisig script requires S, R, M, N and public key hashes
 * S must be zero now
 * and N equals to publicKeyHashes size
 * so only need to provide R, M and public key hashes
 */
export interface MultisigScript {
  /** first nth public keys must match, 1 byte */
  R: number;
  /** threshold, 1 byte */
  M: number;
  /** blake160 hashes of compressed public keys */
  publicKeyHashes: Hash[];
  /** locktime in since format */
  since?: PackedSince;
}

export type FromInfo = MultisigScript | Address;

// 65 bytes zeros
const SIGNATURE_PLACEHOLDER: HexString =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

function ensureSecp256k1Blake160Multisig(script: Script, config: Config): void {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;
  if (
    template.CODE_HASH !== script.code_hash ||
    template.HASH_TYPE !== script.hash_type
  ) {
    throw new Error(
      "Provided script is not SECP256K1_BLAKE160_MULTISIG script!"
    );
  }
}

/**
 *
 * @param params multisig script params
 * @returns serialized multisig script
 */
export function serializeMultisigScript({
  R,
  M,
  publicKeyHashes,
}: MultisigScript): HexString {
  if (R < 0 || R > 255) {
    throw new Error("`R` should be less than 256!");
  }
  if (M < 0 || M > 255) {
    throw new Error("`M` should be less than 256!");
  }
  // TODO: validate publicKeyHashes
  return (
    "0x00" +
    ("00" + R.toString(16)).slice(-2) +
    ("00" + M.toString(16)).slice(-2) +
    ("00" + publicKeyHashes.length.toString(16)).slice(-2) +
    publicKeyHashes.map((h) => h.slice(2)).join("")
  );
}

/**
 *
 * @param serializedMultisigScript
 * @param since
 * @returns lock script args
 */
export function multisigArgs(
  serializedMultisigScript: HexString,
  since?: PackedSince
): HexString {
  let sinceLE = "0x";
  if (since != null) {
    sinceLE = toBigUInt64LE(BigInt(since));
  }
  return (
    new CKBHasher().update(serializedMultisigScript).digestHex().slice(0, 42) +
    sinceLE.slice(2)
  );
}

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, bigint]>;

/**
 * transfer capacity from multisig script cells
 *
 * @param txSkeleton
 * @param fromInfo fromAddress or fromMultisigScript, if this address new to txSkeleton inputs, must use fromMultisigScript
 * @param toAddress
 * @param amount transfer CKB capacity in shannon.
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  {
    config = undefined,
    requireToAddress = true,
    assertAmountEnough = true,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, bigint]> {
  config = config || getConfig();
  if (!config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE16_MULTISIG script setup!"
    );
  }
  const scriptOutPoint: OutPoint = {
    tx_hash: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.TX_HASH,
    index: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.INDEX,
  };

  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type ===
        config!.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.DEP_TYPE &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(scriptOutPoint, {
          validate: false,
        })
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: scriptOutPoint,
        dep_type: config!.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.DEP_TYPE,
      });
    });
  }

  let fromScript: Script | undefined;
  let multisigScript: HexString | undefined;
  if (typeof fromInfo === "string") {
    // fromInfo is an address
    fromScript = parseAddress(fromInfo, { config });
  } else {
    multisigScript = serializeMultisigScript(fromInfo);
    const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);
    fromScript = {
      code_hash: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.CODE_HASH,
      hash_type: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.HASH_TYPE,
      args: fromScriptArgs,
    };
  }

  ensureSecp256k1Blake160Multisig(fromScript, config);

  const noMultisigBefore = !txSkeleton.get("inputs").find((i) => {
    return new ScriptValue(i.cell_output.lock, { validate: false }).equals(
      new ScriptValue(fromScript!, { validate: false })
    );
  });

  if (noMultisigBefore && fromInfo === "string") {
    throw new Error("MultisigScript is required for witness!");
  }

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  amount = BigInt(amount || 0);
  if (toAddress) {
    const toScript = parseAddress(toAddress, { config });

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cell_output: {
          capacity: "0x" + amount.toString(16),
          lock: toScript,
          type: undefined,
        },
        data: "0x",
        out_point: undefined,
        block_hash: undefined,
      });
    });
  }

  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && amount > 0; ++i) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity = BigInt(output.cell_output.capacity);
      let deductCapacity;
      if (amount >= cellCapacity) {
        deductCapacity = cellCapacity;
      } else {
        deductCapacity = cellCapacity - minimalCellCapacity(output);
        if (deductCapacity > amount) {
          deductCapacity = amount;
        }
      }
      amount -= deductCapacity;
      output.cell_output.capacity =
        "0x" + (cellCapacity - deductCapacity).toString(16);
    }
  }
  // remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => BigInt(output.cell_output.capacity) !== BigInt(0)
    );
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (amount > 0) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }
    // TODO: ignore locktime now.
    const cellCollector = cellProvider.collector({
      lock: fromScript,
    });
    const changeCell: Cell = {
      cell_output: {
        capacity: "0x0",
        lock: fromScript,
        type: undefined,
      },
      data: "0x",
      out_point: undefined,
      block_hash: undefined,
    };
    let changeCapacity = BigInt(0);
    for await (const inputCell of cellCollector.collect()) {
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(inputCell)
      );
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
      const inputCapacity = BigInt(inputCell.cell_output.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;
      if (
        amount === BigInt(0) &&
        (changeCapacity === BigInt(0) ||
          changeCapacity > minimalCellCapacity(changeCell))
      ) {
        break;
      }
    }
    if (changeCapacity > BigInt(0)) {
      changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(changeCell)
      );
    }
  }
  if (amount > 0 && assertAmountEnough) {
    throw new Error("Not enough capacity in from address!");
  }

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript!, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }

    // if using MultisigScript, check witnesses
    if (noMultisigBefore || typeof fromInfo !== "string") {
      let witness = txSkeleton.get("witnesses").get(firstIndex)!;
      const newWitnessArgs: WitnessArgs = {
        lock:
          "0x" +
          multisigScript!.slice(2) +
          SIGNATURE_PLACEHOLDER.slice(2).repeat((fromInfo as MultisigScript).M),
      };
      if (witness !== "0x") {
        const witnessArgs = new core.WitnessArgs(new Reader(witness));
        const lock = witnessArgs.getLock();
        if (
          lock.hasValue() &&
          new Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock
        ) {
          throw new Error(
            "Lock field in first witness is set aside for signature!"
          );
        }
        const inputType = witnessArgs.getInputType();
        if (inputType.hasValue()) {
          newWitnessArgs.input_type = new Reader(
            inputType.value().raw()
          ).serializeJson();
        }
        const outputType = witnessArgs.getOutputType();
        if (outputType.hasValue()) {
          newWitnessArgs.output_type = new Reader(
            outputType.value().raw()
          ).serializeJson();
        }
      }
      witness = new Reader(
        core.SerializeWitnessArgs(
          normalizers.NormalizeWitnessArgs(newWitnessArgs)
        )
      ).serializeJson();
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.set(firstIndex, witness)
      );
    }
  }
  if (!assertAmountEnough) {
    return [txSkeleton, amount];
  }
  return txSkeleton;
}

/**
 * pay fee by multisig script cells
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount fee in shannon
 * @param options
 */
export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: bigint,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  return transfer(txSkeleton, fromInfo, undefined, amount, {
    config,
    requireToAddress: false,
  });
}

/**
 * Inject capacity from `fromInfo` to target output.
 *
 * @param txSkeleton
 * @param outputIndex
 * @param fromInfo
 * @param options
 */
export async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number,
  fromInfo: FromInfo,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BigInt(
    txSkeleton.get("outputs").get(outputIndex)!.cell_output.capacity
  );
  return transfer(txSkeleton, fromInfo, undefined, capacity, {
    config,
    requireToAddress: false,
  });
}

/**
 * Setup input cell infos, such as cell deps and witnesses.
 *
 * @param txSkeleton
 * @param inputIndex
 * @param fromInfo
 * @param options
 */
export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputIndex: number,
  fromInfo?: FromInfo | undefined,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (inputIndex >= txSkeleton.get("inputs").size) {
    throw new Error("Invalid input index!");
  }
  const inputLock = txSkeleton.get("inputs").get(inputIndex)!.cell_output.lock;
  const fromAddress = generateAddress(inputLock, { config });
  return transfer(txSkeleton, fromInfo || fromAddress, undefined, 0n, {
    config,
    requireToAddress: false,
  });
}

const _emptyCKBHasherValue = new CKBHasher();
function hashWitness(
  hasher: typeof _emptyCKBHasherValue,
  witness: HexString
): void {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  view.setBigUint64(0, BigInt(new Reader(witness).length()), true);
  hasher.update(lengthBuffer);
  hasher.update(witness);
}

/**
 * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
 *
 * @param txSkeleton
 * @param options
 */
export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();
  if (!config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE160_MULTISIG script setup!"
    );
  }
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  let processedArgs = Set();
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = ckbHash(
    core.SerializeRawTransaction(normalizers.NormalizeRawTransaction(tx))
  ).serializeJson();
  const inputs = txSkeleton.get("inputs");
  const witnesses = txSkeleton.get("witnesses");
  let signingEntries = txSkeleton.get("signingEntries");
  for (let i = 0; i < inputs.size; i++) {
    const input = inputs.get(i)!;
    if (
      template.CODE_HASH === input.cell_output.lock.code_hash &&
      template.HASH_TYPE === input.cell_output.lock.hash_type &&
      !processedArgs.has(input.cell_output.lock.args)
    ) {
      processedArgs = processedArgs.add(input.cell_output.lock.args);
      const lockValue = new values.ScriptValue(input.cell_output.lock, {
        validate: false,
      });
      const hasher = new CKBHasher();
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
            new values.ScriptValue(otherInput.cell_output.lock, {
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
      const signingEntry = {
        type: "witness_args_lock",
        index: i,
        message: hasher.digestHex(),
      };
      signingEntries = signingEntries.push(signingEntry);
    }
  }
  txSkeleton = txSkeleton.set("signingEntries", signingEntries);
  return txSkeleton;
}

export default {
  transfer,
  payFee,
  prepareSigningEntries,
  serializeMultisigScript,
  multisigArgs,
  injectCapacity,
  setupInputCell,
};
