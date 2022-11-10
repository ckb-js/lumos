import { Indexer, helpers, Address, Script, RPC, hd, config, Cell, commons, BI } from "@ckb-lumos/lumos";
import { sudt } from "@ckb-lumos/common-scripts";
import { BIish } from "@ckb-lumos/bi";
import { payFeeByFeeRate } from "@ckb-lumos/common-scripts/lib/common";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";
import { List } from "immutable";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { bytes, number } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";

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

const getTotalCapacity = (list: Cell[] | List<Cell>) => {
  const reducer = (acc: BI, cur: Cell) => acc.add(cur.cellOutput.capacity);

  // typescript does not allow merge two reduce into one
  return Array.isArray(list) ? list.reduce(reducer, BI.from(0)) : list.reduce(reducer, BI.from(0));
};

export const generateAddressInfoFromPrivateKey = (privateKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privateKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript: Script = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };
  const address = helpers.encodeToAddress(lockScript, { config: AGGRON4 });
  return {
    lockScript,
    address,
    pubKey,
  };
};

export const SUDT_PER_CELL_VALUE = 50000;
export const issueSUDT = async (privateKey: string) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  const account = generateAddressInfoFromPrivateKey(privateKey);
  txSkeleton = await sudt.issueToken(txSkeleton, account.address, SUDT_PER_CELL_VALUE, undefined, undefined, {
    config: AGGRON4,
  });

  txSkeleton = await payFeeByFeeRate(txSkeleton, [account.address], 1000, undefined, { config: AGGRON4 });
  const tx = signTx(txSkeleton, [privateKey]);

  const txHash = await rpc.sendTransaction(tx, "passthrough");
  return txHash;
};

//
// 1 CKB = ? SUDT
export const CKB2SUDTRate = 1;

/**
 * Create a CKB to SUDT exchange transaction, sign it, and send it it to the testnet
 * @param issuerPrivateKey
 * @param holderPrivateKey
 * @param CKBCapacity
 * @returns Transaction hash
 */
export async function transferCKB2SUDT(issuerPrivateKey: string, holderPrivateKey: string, CKBCapacity: BIish) {
  const issuerAccountInfo = generateAddressInfoFromPrivateKey(issuerPrivateKey);
  const holderAccountInfo = generateAddressInfoFromPrivateKey(holderPrivateKey);
  const SUDT_SCRIPT = AGGRON4.SCRIPTS.SUDT!;

  // STEP1: create a txSkeleton
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  CKBCapacity = BI.from(CKBCapacity);
  const SUDTAmount = CKBCapacity.div(1e8).mul(CKB2SUDTRate);

  txSkeleton = addCellDep(txSkeleton, {
    outPoint: {
      txHash: SUDT_SCRIPT.TX_HASH,
      index: SUDT_SCRIPT.INDEX,
    },
    depType: SUDT_SCRIPT.DEP_TYPE,
  });

  txSkeleton = addCellDep(txSkeleton, {
    outPoint: {
      txHash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
      index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
    },
    depType: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
  });

  const issuerSUDTCells: Cell[] = [];
  const holderCKBCells: Cell[] = [];
  for await (const cell of indexer
    .collector({
      lock: helpers.parseAddress(issuerAccountInfo.address, { config: AGGRON4 }),
      type: { script: { codeHash: SUDT_SCRIPT.CODE_HASH, hashType: SUDT_SCRIPT.HASH_TYPE, args: "0x" } },
    })
    .collect()) {
    issuerSUDTCells.push(cell);
  }

  for await (const cell of indexer
    .collector({ lock: helpers.parseAddress(holderAccountInfo.address, { config: AGGRON4 }), type: "empty" })
    .collect()) {
    holderCKBCells.push(cell);
  }

  // put issuer SUDT cells into inputs
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    let total = BI.from(0);
    for (const cell of issuerSUDTCells) {
      if (total.gt(SUDTAmount)) {
        break;
      }
      inputs = inputs.push(cell);
      total = total.add(number.Uint128LE.unpack(cell.data));
    }
    return inputs;
  });
  // we need all picked SUDT cells from SUDT issuer
  // because we need recycle SUDT cell capacity back to issuer address
  const pickedSUDTCells = txSkeleton.inputs;

  // the type script for SUDT
  const issuerTypeScript = {
    codeHash: SUDT_SCRIPT.CODE_HASH,
    hashType: SUDT_SCRIPT.HASH_TYPE,

    // it determine which SUDT type the cell is
    args: computeScriptHash(issuerAccountInfo.lockScript),
  };

  // SUDT target output, SUDT issuer -> CKB holder
  const SUDTTargetOutput: Cell = {
    cellOutput: {
      capacity: "0x0",
      lock: holderAccountInfo.lockScript,
      type: issuerTypeScript,
    },
    data: bytes.hexify(number.Uint128LE.pack(SUDTAmount)),
  };

  console.log(calculateSUDTAmountSum(issuerSUDTCells).toBigInt());
  // SUDT change output, SUDT issuer -> SUDT issuer
  const SUDTChangeOutput: Cell = {
    cellOutput: {
      capacity: "0x0",
      lock: issuerAccountInfo.lockScript,
      type: issuerTypeScript,
    },
    data: bytes.hexify(number.Uint128LE.pack(calculateSUDTAmountSum(issuerSUDTCells).sub(SUDTAmount))),
  };

  SUDTTargetOutput.cellOutput.capacity = BI.from(helpers.minimalCellCapacity(SUDTTargetOutput)).toHexString();
  SUDTChangeOutput.cellOutput.capacity = BI.from(helpers.minimalCellCapacity(SUDTChangeOutput)).toHexString();

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(SUDTTargetOutput, SUDTChangeOutput);
  });

  const holderCKBInputCells: Cell[] = [];

  let CKBInputAmount = BI.from(0);
  for (const cell of holderCKBCells) {
    if (CKBInputAmount.gt(CKBCapacity)) {
      break;
    }
    holderCKBInputCells.push(cell);
    CKBInputAmount = CKBInputAmount.add(cell.cellOutput.capacity);
  }
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(...holderCKBInputCells);
  });

  /*
  we need recycle SUDT cell's capacity back to issuer address
  for example, the transaction inputs have 3 SUDT cells, and the transaction outputs have 2 SUDT cells.
  the 1 SUDT cell's capacity should back to issuer address.
  */
  const recycleSUDTCapacity = getTotalCapacity(pickedSUDTCells)
    .sub(SUDTTargetOutput.cellOutput.capacity)
    .sub(SUDTChangeOutput.cellOutput.capacity);

  const CKBOutput: Cell = {
    cellOutput: {
      capacity: BI.from(CKBCapacity).toHexString(),
      lock: issuerAccountInfo.lockScript,
    },
    data: "0x",
  };

  // exchanged CKB from holder to issuer and change
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(CKBOutput);
  });

  if (recycleSUDTCapacity.gt(0)) {
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: recycleSUDTCapacity.toHexString(),
          lock: issuerAccountInfo.lockScript,
        },
        data: "0x",
      });
    });
  }

  const inputsCapacity = getTotalCapacity(txSkeleton.inputs);
  const outputsCapacity = getTotalCapacity(txSkeleton.outputs);

  const CKBChangeCapacity = inputsCapacity.sub(outputsCapacity);

  if (CKBChangeCapacity.lt(0)) {
    throw new Error("CKB holder capacity not enough");
  }

  const CKBChangeOutput: Cell = {
    cellOutput: {
      capacity: CKBChangeCapacity.toHexString(),
      lock: holderAccountInfo.lockScript,
    },
    data: "0x",
  };
  txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(CKBChangeOutput));

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    const placeholderWitness = {
      lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    };

    const witnessArgs = bytes.hexify(blockchain.WitnessArgs.pack(placeholderWitness));

    for (let index = 0; index < txSkeleton.inputs.size; index++) {
      witnesses = witnesses.push(witnessArgs);
    }

    return witnesses;
  });

  console.log(txSkeleton.toJS());
  txSkeleton = await payFeeByFeeRate(txSkeleton, [holderAccountInfo.address], 1000, undefined, { config: AGGRON4 });

  // STEP2: sign the transaction skeleton
  const tx = signTx(txSkeleton, [issuerPrivateKey, holderPrivateKey, issuerPrivateKey]);

  // STEP3: send it to testnet
  const txHash = await rpc.sendTransaction(tx, "passthrough");
  return txHash;
}

/**
 * sign a transaction
 */
export function signTx(txSkeleton: helpers.TransactionSkeletonType, privateKey: string[]) {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const signatures = txSkeleton.get("signingEntries").map(({ message }, index) => {
    return hd.key.signRecoverable(message, privateKey[index]);
  });
  const tx = helpers.sealTransaction(txSkeleton, signatures.toJSON());
  return tx;
}

export function calculateSUDTAmountSum(cells: Cell[]) {
  let amount = BI.from(0);
  for (const cell of cells) {
    if (cell.cellOutput.type?.codeHash === AGGRON4.SCRIPTS.SUDT.CODE_HASH) {
      amount = amount.add(number.Uint128LE.unpack(cell.data));
    }
  }

  return amount;
}

export function calculateCKBSum(cells: Cell[]) {
  let amount = BI.from(0);

  for (const cell of cells) {
    amount = amount.add(cell.cellOutput.capacity);
  }

  return amount;
}

/**
 * collect all SUDT cells and calculate their data sum
 * @param address SUDT Issuer address
 * @returns the amount of SUDT in the address
 */
export async function fetchSUDTBalance(address: string, issuerLockScript: Script) {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address, { config: AGGRON4 }),
    type: {
      script: {
        codeHash: AGGRON4.SCRIPTS.SUDT.CODE_HASH,
        hashType: AGGRON4.SCRIPTS.SUDT.HASH_TYPE,
        args: computeScriptHash(issuerLockScript),
      },
    },
  });
  let amount = BI.from(0);

  for await (const cell of collector.collect()) {
    amount = amount.add(number.Uint128LE.unpack(cell.data));
  }
  return amount;
}

/**
 * collect all cells and calculate their capacity sum
 * @param address
 * @returns the capacity owns by the address
 */
export async function fetchCKBBalance(address: string) {
  const collector = indexer.collector({ lock: helpers.parseAddress(address, { config: AGGRON4 }), type: "empty" });
  let amount = BI.from(0);
  for await (const cell of collector.collect()) {
    amount = amount.add(cell.cellOutput.capacity);
  }

  return amount;
}
