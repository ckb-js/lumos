import {
  config,
  Script,
  Address,
  helpers,
  Indexer,
  RPC,
  commons,
  hd,
  toolkit,
  HexString,
  utils,
  BI,
  Cell,
  core,
} from "@ckb-lumos/lumos";
import { SerializeRcLockWitnessLock } from "./generated/omni";
import { generateSingleProof, ProofScheme, ProofMask, buildRcVec, h256ToHex, hexToH256, H256 } from './lib'; 
const { Reader } = toolkit;
const { deploy } = commons;

export const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    // for more about Omni lock, please check https://github.com/XuJiandong/docs-bank/blob/master/omni_lock.md
    OMNI_LOCK: {
      CODE_HASH: "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
      HASH_TYPE: "type",
      TX_HASH: "0x27b62d8be8ed80b9f56ee0fe41355becdb6f6a40aeba82d3900434f43b1c8b60",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
});

config.initializeConfig(CONFIG);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

type Account = {
  lockScript: Script;
  address: Address;
  pubKey: string;
  privKey: string;
};

const generateSECP256K1Account = (privKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = CONFIG.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: args,
  };
  const address = helpers.encodeToAddress(lockScript, { config: CONFIG });
  return {
    lockScript,
    address,
    pubKey,
    privKey,
  };
};

export const alice = generateSECP256K1Account("0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245");
export const bob = generateSECP256K1Account("0x5368b818f59570b5bc078a6a564f098a191dcb8938d95c413be5065fd6c42d32");

export const rpc = new RPC(CKB_RPC_URL);
export const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export const deployRCEVecCell = async (option: {
  from: Address;
  fromPrivKey: HexString;
  rceCellHashs: HexString[];
}): Promise<config.ScriptConfig> => {
  const rcData = buildRcVec(option.rceCellHashs);

  return deployRCECell({ from: option.from, fromPrivKey: option.fromPrivKey, rcData })
}

export const deployRCECell = async (option: {
  from: Address;
  fromPrivKey: HexString;
  rcData: H256;
}): Promise<config.ScriptConfig> => {
  const { txSkeleton, typeId: RCETypeScript } = await deploy.generateDeployWithTypeIdTx({
    cellProvider: indexer,
    scriptBinary: new Uint8Array(option.rcData),
    fromInfo: option.from,
    config: CONFIG,
  })

  const tx = sealTxSkeleton(txSkeleton, option.fromPrivKey);
  const txHash = await rpc.send_transaction(tx);

  return {
    CODE_HASH: utils.computeScriptHash(RCETypeScript),
    HASH_TYPE: "type",
    TX_HASH: txHash,
    INDEX: "0x0",
    DEP_TYPE: "code",
  };

}

const sealTxSkeleton = (skeleton: helpers.TransactionSkeletonType, privateKey: string) => {
  let txSkeleton = commons.common.prepareSigningEntries(skeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privateKey);
  return helpers.sealTransaction(txSkeleton, [Sig]);
};

export function toMessages(tx: helpers.TransactionSkeletonType) {
  const hasher = new utils.CKBHasher();

  // locks you want to sign
  const signLock = tx.inputs.get(0)?.cell_output.lock!;
  const messageGroup = commons.createP2PKHMessageGroup(tx, [signLock], {
    hasher: {
      update: (message) => hasher.update(message.buffer),
      digest: () => new Uint8Array(hasher.digestReader().toArrayBuffer()),
    },
  });

  return messageGroup[0];
}

interface SmtProof {
  mask: HexString,
  proof: HexString,
}

export const sealOmnilockTxSkeleton = (
  txSkeleton: helpers.TransactionSkeletonType,
  privateKey: string,
  identity: HexString,
  proofs: Array<SmtProof>,
) => {
  const OMNI_SIGNATURE_PLACEHOLDER = new Reader(
    "0x" +
      "00".repeat(
        SerializeRcLockWitnessLock({
          signature: new Reader("0x" + "00".repeat(65)),
          rc_identity: {
            identity: new Reader(identity).toArrayBuffer(),
            proofs: proofs.map(p => ({
              mask: new Reader(p.mask),
              proof: new Reader(p.proof),
            }))
          },
        }).byteLength
      )
  );

  const newWitnessArgs = { lock: OMNI_SIGNATURE_PLACEHOLDER };
  const witness = new Reader(
    core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs))
  ).serializeJson();

  // fill txSkeleton's witness with 0
  for (let i = 0; i < txSkeleton.inputs.toArray().length; i++) {
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(witness));
  }

  const messages = toMessages(txSkeleton);
  const signature = hd.key.signRecoverable(messages.message, privateKey);

  const signedWitnessArgs = new Reader(
    SerializeRcLockWitnessLock({
      signature: new Reader(signature),
      rc_identity: {
        identity: new Reader(identity).toArrayBuffer(),
        proofs: proofs.map(p => ({
          mask: new Reader(p.mask),
          proof: new Reader(p.proof),
        })),
      },
    })
  );

  const signedWitness = new Reader(
    core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs({ lock: signedWitnessArgs }))
  ).serializeJson();

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(0, signedWitness));
  return helpers.createTransactionFromSkeleton(txSkeleton);
};

export interface TransferOptions {
  from: string;
  to: string;
  amount: string;
  rceCells: Array<config.ScriptConfig>;
  omniIdentity?: {
    identity: string;
    proofs: string;
  };
}

export async function buildTransferByOmnilockAdministrator(options: TransferOptions) {
  let tx = helpers.TransactionSkeleton({});
  const fromScript = helpers.parseAddress(options.from);
  const toScript = helpers.parseAddress(options.to);

  // additional 1 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BI.from(options.amount).add(100000000);
  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  const collector = indexer.collector({ lock: fromScript, type: "empty" });
  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cell_output.capacity);
    collectedCells.push(cell);
    if (BI.from(collectedSum).gte(neededCapacity)) break;
  }

  if (collectedSum.lt(neededCapacity)) {
    throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `);
  }

  const transferOutput: Cell = {
    cell_output: {
      capacity: BI.from(options.amount).toHexString(),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cell_output: {
      capacity: collectedSum.sub(neededCapacity).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  tx = tx.update("inputs", (inputs) => inputs.push(...collectedCells));
  tx = tx.update("outputs", (outputs) => outputs.push(transferOutput, changeOutput));
  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      // secp256k1
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      },
      // omni lock dep
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.OMNI_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.OMNI_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.OMNI_LOCK.DEP_TYPE,
      },
      // RCE cells
      ...options.rceCells.map(cell => ({
          out_point: {
            tx_hash: cell.TX_HASH,
            index: cell.INDEX,
          },
          dep_type: cell.DEP_TYPE,
      }))
    )
  );

  return tx;
}

export const generateOmniLockAdministratorAddress = (pubHash: string, typeId: string) => {
  const template = CONFIG.SCRIPTS["OMNI_LOCK"]!;
  const lockScript: Script = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: `0x00${pubHash}01${typeId}`,
  };

  return helpers.encodeToAddress(lockScript, { config: CONFIG });
}

const main = async () => {
  const RC_IDENTITY = '0x00' + bob.lockScript.args.substring(2);
  const { proof: wlProof, rcData: wlRcData } = generateSingleProof(
    ProofScheme.OnWhiteList,
    [hexToH256(RC_IDENTITY)]
  )

  const { proof: blProof, rcData: blRcData } = generateSingleProof(
    ProofScheme.NotOnBlackList,
    [hexToH256(RC_IDENTITY)]
  )

  // const wlRceCellScript = await deployRCECell({ 
  //   from: alice.address,
  //   fromPrivKey: alice.privKey,
  //   rcData: wlRcData,
  // });
  
  // generate by upper ↑
  const wlRceCellScript: config.ScriptConfig = {
    CODE_HASH: '0x7ff95669983cb7c54b8cb302f2f202a8d178c1b76f53c0fa76ba03ec97df6042',
    HASH_TYPE: 'type',
    TX_HASH: '0x584f8105aa6a39bd139a0f2321ea991b5033612f31339f5ddcf9eaf7e097af13',
    INDEX: '0x0',
    DEP_TYPE: 'code'
  }

  // const blRceCellScript = await deployRCECell({ 
  //   from: alice.address,
  //   fromPrivKey: alice.privKey,
  //   rcData: blRcData,
  // });

  // generate by upper ↑
  const blRceCellScript: config.ScriptConfig = {
    CODE_HASH: '0x80a3aa808da4baf19728ba98297c3e96f10a6eccba7a10f66e35a8ef0845ab44',
    HASH_TYPE: 'type',
    TX_HASH: '0xa57484c8627a6c8f1ca47e95e2c1c26315154e2c5e34f0f02f4a9678411c889d',
    INDEX: '0x0',
    DEP_TYPE: 'code'
  }

  // const RceVecCellScript = await deployRCEVecCell({ 
  //   from: alice.address,
  //   fromPrivKey: alice.privKey,
  //   rceCellHashs: [wlRceCellScript.CODE_HASH, blRceCellScript.CODE_HASH],
  // });

  // generate by upper ↑
  const RceVecCellScript: config.ScriptConfig = {
    CODE_HASH: '0x23abc4961b1dfecc316f6cbf45e16da19faa50980ac6a8fd81e7df4211069945',
    HASH_TYPE: 'type',
    TX_HASH: '0x0d65b11ef71dcd7d41d3b3ec345fd41dcbebd555074419afe1511a94f31dc9c2',
    INDEX: '0x0',
    DEP_TYPE: 'code'
  }

  const finalCellScript: config.ScriptConfig = RceVecCellScript;

  const smtProofs = [blProof, wlProof].map((proof) => ({
    mask: ProofMask.BothOn,
    proof: h256ToHex(proof),
  }));

  const TYPE_ID = finalCellScript.CODE_HASH.substring(2);
  const aliceOmniAddr = generateOmniLockAdministratorAddress(alice.lockScript.args.substring(2), TYPE_ID);
  
  const txSkeleton = await buildTransferByOmnilockAdministrator({
    rceCells: [wlRceCellScript, blRceCellScript, finalCellScript],
    from: aliceOmniAddr,
    to: bob.address,
    amount: "10000000000",
  });

  const signedTx = sealOmnilockTxSkeleton(
    txSkeleton,
    bob.privKey,
    RC_IDENTITY,
    smtProofs,
  );
  const txHash = await rpc.send_transaction(signedTx, "passthrough");
  console.log(txHash)
}

main()
