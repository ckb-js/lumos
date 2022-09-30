/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/explicit-module-boundary-types */

import * as omnilock from "./omnilock";
import { Set } from "immutable";
import {
  createTransactionFromSkeleton,
  parseAddress,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { bytes } from "@ckb-lumos/codec";
import {
  values,
  utils,
  CellDep,
  Script,
  Address,
  HexString,
  blockchain,
} from "@ckb-lumos/base";
const { CKBHasher, ckbHash } = utils;
import { Config } from "@ckb-lumos/config-manager";
import { BI } from "@ckb-lumos/bi";

export function addCellDep(
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

export function generateDaoScript(config: Config): Script {
  const template = config.SCRIPTS.DAO!;

  return {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: "0x",
  };
}

export function isSecp256k1Blake160Script(
  script: Script,
  config: Config
): boolean {
  const template = config.SCRIPTS.SECP256K1_BLAKE160!;
  return (
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
  );
}

export function isSecp256k1Blake160Address(
  address: Address,
  config: Config
): boolean {
  const script = parseAddress(address, { config });
  return isSecp256k1Blake160Script(script, config);
}

export function isOmnilockScript(script: Script, config: Config): boolean {
  const template = config.SCRIPTS.OMNILOCK!;
  return (
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
  );
}

export function isOmnilockAddress(address: Address, config: Config): boolean {
  const script = parseAddress(address, { config });
  return isOmnilockScript(script, config);
}

export function isSecp256k1Blake160MultisigScript(
  script: Script,
  config: Config
): boolean {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;
  return (
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
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
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
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
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
  );
}

export function isAcpScript(script: Script, config: Config): boolean {
  const template = config.SCRIPTS.ANYONE_CAN_PAY;

  if (!template) {
    throw new Error(`ANYONE_CAN_PAY script not defined in config!`);
  }

  return (
    !!script &&
    script.codeHash === template.CODE_HASH &&
    script.hashType === template.HASH_TYPE
  );
}

export function isAcpAddress(address: Address, config: Config): boolean {
  const script = parseAddress(address, { config });

  return isAcpScript(script, config);
}

/**
 * Hash a witness with a hasher
 * @param hasher The hasher object which should have a `update` method.
 * @param witness witness data, the inputs to hasher will derived from it
 * @param onUpdateHash calls when update data into hasher. **This method will only invoked once with contacted each input bytes**
 */
export function hashWitness(
  hasher: { update: (value: HexString | ArrayBuffer) => unknown },
  witness: HexString,
  onUpdateHash?: (input: Uint8Array) => void
): void {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  const witnessHexString = BI.from(bytes.bytify(witness).length).toString(16);
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
  onUpdateHash?.(bytes.concat(lengthBuffer, witness));
}
/* eslint-enable camelcase, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  config: Config,
  scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "OMNILOCK"
): TransactionSkeletonType {
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }
  let processedArgs = Set<string>();
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = ckbHash(blockchain.RawTransaction.pack(tx));
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
      const hasher = new CKBHasher();
      hasher.update(txHash);
      if (i >= witnesses.size) {
        throw new Error(
          `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`
        );
      }
      let hashContentExceptRawTx = new Uint8Array();

      const onUpdateHasher = (input: Uint8Array) => {
        hashContentExceptRawTx = bytes.concat(hashContentExceptRawTx, input);
      };

      hashWitness(hasher, witnesses.get(i)!, onUpdateHasher);
      for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
        const otherInput = inputs.get(j)!;
        if (
          lockValue.equals(
            new values.ScriptValue(otherInput.cellOutput.lock, {
              validate: false,
            })
          )
        ) {
          hashWitness(hasher, witnesses.get(j)!, onUpdateHasher);
        }
      }
      for (let j = inputs.size; j < witnesses.size; j++) {
        hashWitness(hasher, witnesses.get(j)!, onUpdateHasher);
      }
      const signingEntry = {
        type: "witness_args_lock",
        index: i,
        message: hasher.digestHex(),
        hashContentExceptRawTx,
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
  scriptType:
    | "SECP256K1_BLAKE160"
    | "SECP256K1_BLAKE160_MULTISIG"
    | "DAO"
    | "OMNILOCK"
): void {
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }
  if (
    template.CODE_HASH !== script.codeHash ||
    template.HASH_TYPE !== script.hashType
  ) {
    throw new Error(`Provided script is not ${scriptType} script!`);
  }
}

/* 65-byte zeros in hex */
export const SECP_SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
/* 85-byte zeros in hex */
export const OMNILOCK_SIGNATURE_PLACEHOLDER = `0x${"00".repeat(
  omnilock.OmnilockWitnessLock.pack({ signature: SECP_SIGNATURE_PLACEHOLDER })
    .byteLength
)}`;

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
