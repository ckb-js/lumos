// payFeeByFeeRate
import { Indexer, helpers, Address, Script, RPC, hd, config, Cell, commons, core, toolkit, BI } from "@ckb-lumos/lumos";
import { sudt } from "@ckb-lumos/common-scripts";
import { BIish } from "@ckb-lumos/bi";
import { values } from "@ckb-lumos/base";
import { payFeeByFeeRate, c } from "@ckb-lumos/common-scripts/lib/common";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";
import { readBigUInt128LECompatible, computeScriptHash, toBigUInt128LE } from "@ckb-lumos/base/lib/utils";

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

export const mintSUDT = async (privateKey: string, SUDTAmount: BIish) => {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer }).update("witnesses", (witnesses) => {
    const dummyWitness = {
      lock: new toolkit.Reader(
        "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      ).toArrayBuffer(),
    };

    const witnessArgs = new toolkit.Reader(core.SerializeWitnessArgs(dummyWitness)).serializeJson();
    return witnesses.push(witnessArgs);
  });

  const account = generateAccountFromPrivateKey(privateKey);

  txSkeleton = await sudt.issueToken(txSkeleton, account.address, SUDTAmount, undefined, undefined, {
    config: AGGRON4,
  });
  txSkeleton = await payFeeByFeeRate(txSkeleton, [account.address], 1000, undefined, { config: AGGRON4 });
  const tx = await signTx(txSkeleton, [privateKey]);

  const txHash = await rpc.send_transaction(tx, "passthrough");
  console.log(txHash);
  return txHash;
};

export function signTx(txSkeleton: helpers.TransactionSkeletonType, privateKey: string[]) {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const signatures = txSkeleton.get("signingEntries").map(({ message }, index) => {
    return hd.key.signRecoverable(message, privateKey[index]);
  });
  const tx = helpers.sealTransaction(txSkeleton, signatures.toJSON());
  return tx;
}

export function calculateSUDTBalance(cells: Cell[]) {
  let amount = BI.from(0);
  for (const cell of cells) {
    if (cell.cell_output.type?.code_hash === AGGRON4.SCRIPTS.SUDT.CODE_HASH) {
      amount = amount.add(readBigUInt128LECompatible(cell.data));
    }
  }

  return amount;
}

export function calculateCKBBalance(cells: Cell[]) {
  let amount = BI.from(0);

  for (const cell of cells) {
    amount = amount.add(cell.cell_output.capacity);
  }

  return amount;
}

export async function fetchSUDTBalance(address: string) {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address, { config: AGGRON4 }),
  });
  let amount = BI.from(0);

  for await (const cell of collector.collect()) {
    amount = amount.add(
      readBigUInt128LECompatible(cell.data === "0x" ? "0x00000000000000000000000000000000" : cell.data)
    );
  }
  return amount;
}

export async function fetchCKBBalance(address: string) {
  const collector = indexer.collector({ lock: helpers.parseAddress(address, { config: AGGRON4 }) });
  let amount = BI.from(0);
  for await (const cell of collector.collect()) {
    amount = amount.add(cell.cell_output.capacity);
  }

  return amount;
}

// 1 CKB = ? SUDT
export const CKB2SUDTRate = 100;

export async function transferCKB2SUDT(issuerPrivateKey: string, holderPrivateKey: string, CKBAmount: BIish) {
  const issuerAccountInfo = generateAccountFromPrivateKey(issuerPrivateKey);
  const holderAccountInfo = generateAccountFromPrivateKey(holderPrivateKey);
  const SUDT_SCRIPT = AGGRON4.SCRIPTS.SUDT!;
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  CKBAmount = BI.from(CKBAmount);

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: SUDT_SCRIPT.TX_HASH,
      index: SUDT_SCRIPT.INDEX,
    },
    dep_type: SUDT_SCRIPT.DEP_TYPE,
  });

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
      index: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
    },
    dep_type: AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
  });

  const issuerSUDTCells: Cell[] = [];
  const issuerCKBCells: Cell[] = [];
  const holderCKBCells: Cell[] = [];
  for await (const cell of indexer
    .collector({ lock: helpers.parseAddress(issuerAccountInfo.address, { config: AGGRON4 }) })
    .collect()) {
    if (cell.cell_output.type?.code_hash === SUDT_SCRIPT.CODE_HASH) {
      issuerSUDTCells.push(cell);
    } else if (cell.cell_output.type === null) {
      issuerCKBCells.push(cell);
    }
  }

  for await (const cell of indexer
    .collector({ lock: helpers.parseAddress(holderAccountInfo.address, { config: AGGRON4 }), type: "empty" })
    .collect()) {
    holderCKBCells.push(cell);
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    let total = BI.from(0);
    for (const cell of issuerSUDTCells) {
      if (total.gt(BI.from(CKBAmount).mul(CKB2SUDTRate))) {
        break;
      }
      inputs = inputs.push(cell);
      total = total.add(readBigUInt128LECompatible(cell.data));
    }
    return inputs;
  });

  const issuerTypeScript = {
    code_hash: SUDT_SCRIPT.CODE_HASH,
    hash_type: SUDT_SCRIPT.HASH_TYPE,
    args: computeScriptHash(issuerAccountInfo.lockScript),
  };

  const SUDTTargetOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: holderAccountInfo.lockScript,
      type: issuerTypeScript,
    },
    data: toBigUInt128LE(BI.from(CKBAmount).mul(CKB2SUDTRate)),
  };

  const SUDTChangeOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: issuerAccountInfo.lockScript,
      type: issuerTypeScript,
    },
    data: toBigUInt128LE(calculateSUDTBalance(issuerSUDTCells).sub(BI.from(CKBAmount).div(1e8).mul(CKB2SUDTRate))),
  };

  SUDTTargetOutput.cell_output.capacity = BI.from(helpers.minimalCellCapacity(SUDTTargetOutput)).toHexString();
  SUDTChangeOutput.cell_output.capacity = BI.from(helpers.minimalCellCapacity(SUDTChangeOutput)).toHexString();

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(SUDTTargetOutput, SUDTChangeOutput);
  });

  const holderCKBInputCells: Cell[] = [];

  let amount = BI.from(0);
  for (const cell of holderCKBCells) {
    if (amount.gt(CKBAmount)) {
      break;
    }
    holderCKBInputCells.push(cell);
    amount = amount.add(cell.cell_output.capacity);
  }
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(...holderCKBInputCells);
  });

  const CKBOutput: Cell = {
    cell_output: {
      capacity: BI.from(CKBAmount).toHexString(),
      lock: issuerAccountInfo.lockScript,
    },
    data: "0x",
  };

  let changeCapacity = calculateCKBBalance(holderCKBInputCells).sub(CKBAmount).sub(1e8);
  changeCapacity = [SUDTTargetOutput, SUDTChangeOutput, CKBOutput].reduce(
    (acc, cur) => acc.sub(cur.cell_output.capacity),
    changeCapacity
  );

  const CKBChangeOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      // capacity: changeCapacity.toHexString(),
      lock: holderAccountInfo.lockScript,
    },
    data: "0x",
  };

  // exchanged CKB from holder to issuer and change
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(CKBOutput /**  CKBChangeOutput  */);
  });

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    const dummyWitness = {
      lock: new toolkit.Reader(
        "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      ).toArrayBuffer(),
    };

    const witnessArgs = new toolkit.Reader(core.SerializeWitnessArgs(dummyWitness)).serializeJson();

    return witnesses.push(witnessArgs, witnessArgs);
  });

  // txSkeleton = await payFeeByFeeRate(txSkeleton, [holderAccountInfo.address], 1000, undefined, { config: AGGRON4 });
  // txSkeleton = await payFeeByFeeRate(txSkeleton, [holderAccountInfo.address], 1000, undefined, { config: AGGRON4 });

  // const SUDTTargetOutput: Cell = {};
  // txSkeleton.update("outputs", (outputs) => {
  //   return outputs.push({
  //     capacity: BI.from(),
  //   });
  // });

  // txSkeleton = await sudt.transfer(
  //   helpers.TransactionSkeleton({ cellProvider: indexer }),
  //   [issuerAccountInfo.address],
  //   token,
  //   holderAccountInfo.address,
  //   BI.from(CKBAmount).mul(CKB2SUDTRate),
  //   // issuerAccountInfo.address
  //   undefined,
  //   undefined,
  //   undefined,
  //   { config: AGGRON4 }
  // );

  // txSkeleton = await commons.common.transfer(
  //   txSkeleton,
  //   [holderAccountInfo.address],
  //   issuerAccountInfo.address,
  //   BI.from(CKBAmount).mul(10 ** 8),
  //   holderAccountInfo.address,
  //   undefined,
  //   { config: AGGRON4 }
  // );

  txSkeleton = await payFeeByFeeRate(txSkeleton, [holderAccountInfo.address], 1000, undefined, { config: AGGRON4 });

  const tx = signTx(txSkeleton, [issuerPrivateKey, holderPrivateKey]);
  const txHash = await rpc.send_transaction(tx, "passthrough");
  console.log(txHash);
  return txHash;
}

export async function transferSUDT2CKB(issuerPrivateKey: string, holderPrivateKey: string, SUDTAmount: BIish) {
  const issuerAccountInfo = generateAccountFromPrivateKey(issuerPrivateKey);
  const holderAccountInfo = generateAccountFromPrivateKey(holderPrivateKey);
  const token = sudt.ownerForSudt(issuerAccountInfo.address, { config: AGGRON4 });
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  // holder send SUDT to issuer
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [holderAccountInfo.address],
    token,
    issuerAccountInfo.address,
    BI.from(SUDTAmount),
    undefined,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  // issuer send CKB to holder
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [issuerAccountInfo.address],
    holderAccountInfo.address,
    BI.from(SUDTAmount)
      .div(CKB2SUDTRate)
      .mul(10 ** 8),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [issuerAccountInfo.address, holderAccountInfo.address],
    1000,
    undefined,
    { config: AGGRON4 }
  );
  const tx = signTx(txSkeleton, [issuerPrivateKey, holderPrivateKey]);
  const txHash = await rpc.send_transaction(tx, "passthrough");
  console.log(txHash);
  return txHash;
}
