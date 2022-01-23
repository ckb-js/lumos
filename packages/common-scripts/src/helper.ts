import { Set } from "immutable";
import {
  createTransactionFromSkeleton,
  parseAddress,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import {
  core,
  values,
  utils,
  CellDep,
  Script,
  Address,
  HexString,
} from "@ckb-lumos/base";
const { CKBHasher, ckbHash } = utils;
import { normalizers, Reader } from "@ckb-lumos/toolkit";
import { Config } from "@ckb-lumos/config-manager";
import { BI } from "@ckb-lumos/bi";

export function addCellDep(
  txSkeleton: TransactionSkeletonType,
  newCellDep: CellDep
): TransactionSkeletonType {
  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type === newCellDep.dep_type &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(newCellDep.out_point, { validate: false })
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: newCellDep.out_point,
        dep_type: newCellDep.dep_type,
      });
    });
  }

  return txSkeleton;
}

export function generateDaoScript(config: Config): Script {
  const template = config.SCRIPTS.DAO!;

  return {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: "0x",
  };
}

export function isSecp256k1Blake160Script(
  script: Script,
  config: Config
): boolean {
  const template = config.SCRIPTS.SECP256K1_BLAKE160!;
  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

export function isSecp256k1Blake160Address(
  address: Address,
  config: Config
): boolean {
  const script = parseAddress(address, { config });
  return isSecp256k1Blake160Script(script, config);
}

export function isSecp256k1Blake160MultisigScript(
  script: Script,
  config: Config
): boolean {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;
  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

export function isSecp256k1Blake160MultisigAddress(
  address: Address,
  config: Config
): boolean {
  const script = parseAddress(address, { config });
  return isSecp256k1Blake160MultisigScript(script, config);
}

export function isDaoScript(
  script: Script | undefined,
  config: Config
): boolean {
  const template = config.SCRIPTS.DAO!;

  return (
    !!script &&
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

export function isSudtScript(
  script: Script | undefined,
  config: Config
): boolean {
  const template = config.SCRIPTS.SUDT;

  if (!template) {
    throw new Error(`SUDT script not defined in config!`);
  }

  return (
    !!script &&
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

export function isAcpScript(script: Script, config: Config): boolean {
  const template = config.SCRIPTS.ANYONE_CAN_PAY;

  if (!template) {
    throw new Error(`ANYONE_CAN_PAY script not defined in config!`);
  }

  return (
    !!script &&
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

export function isAcpAddress(address: Address, config: Config): boolean {
  const script = parseAddress(address, { config });

  return isAcpScript(script, config);
}

export function hashWitness(hasher: any, witness: HexString): void {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  const witnessHexString = BI.from(new Reader(witness).length()).toString(16);
  if (witnessHexString.length <= 8) {
    view.setUint32(0, Number("0x" + witnessHexString), true);
    view.setUint32(4, Number("0x" + "00000000"), true);
  }

  if (witnessHexString.length > 8 && witnessHexString.length <= 16) {
    view.setUint32(0, Number("0x" + witnessHexString.slice(-8)), true);
    view.setUint32(4, Number("0x" + witnessHexString.slice(0, -8)), true);
  }
  hasher.update(lengthBuffer);
  hasher.update(witness);
}

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  config: Config,
  scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG"
): TransactionSkeletonType {
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }
  let processedArgs = Set<string>();
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

export function ensureScript(
  script: Script,
  config: Config,
  scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "DAO"
): void {
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }
  if (
    template.CODE_HASH !== script.code_hash ||
    template.HASH_TYPE !== script.hash_type
  ) {
    throw new Error(`Provided script is not ${scriptType} script!`);
  }
}

/* 65-byte zeros in hex */
export const SECP_SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export default {
  addCellDep,
  generateDaoScript,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  isDaoScript,
  isSudtScript,
  prepareSigningEntries,
  isSecp256k1Blake160Address,
  isSecp256k1Blake160MultisigAddress,
  ensureScript,
  isAcpScript,
  isAcpAddress,
};
