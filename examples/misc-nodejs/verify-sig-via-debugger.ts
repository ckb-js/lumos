import { randomBytes } from "crypto";
import { config, hd, Script } from "@ckb-lumos/lumos";
import { CKBDebuggerDownloader, createTestContext, getDefaultConfig } from "@ckb-lumos/debugger";
import { TransactionSkeleton } from "@ckb-lumos/lumos/helpers";
import { common } from "@ckb-lumos/lumos/common-scripts";
import { blockchain, bytes } from "@ckb-lumos/lumos/codec";
import { computeScriptHash } from "@ckb-lumos/lumos/utils";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";

const context = createTestContext(getDefaultConfig());
const lumosConfig = { PREFIX: "ckt", SCRIPTS: context.scriptConfigs };
config.initializeConfig(lumosConfig);

const privateKey = bytes.hexify(randomBytes(32));

async function main() {
  await new CKBDebuggerDownloader().downloadIfNotExists();

  const txSkeleton = TransactionSkeleton().asMutable();
  const lock: Script = {
    codeHash: context.scriptConfigs.SECP256K1_BLAKE160.CODE_HASH,
    hashType: context.scriptConfigs.SECP256K1_BLAKE160.HASH_TYPE,
    args: hd.key.privateKeyToBlake160(privateKey),
  };

  await common.setupInputCell(txSkeleton, {
    cellOutput: { capacity: "0x123123123", lock: lock },
    data: "0x",
    outPoint: mockOutPoint(),
  });

  txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      depType: context.scriptConfigs.SECP256K1_BLAKE160.DEP_TYPE,
      outPoint: {
        txHash: context.scriptConfigs.SECP256K1_BLAKE160.TX_HASH,
        index: context.scriptConfigs.SECP256K1_BLAKE160.INDEX,
      },
    })
  );

  common.prepareSigningEntries(txSkeleton, { config: lumosConfig });
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const sig = hd.key.signRecoverable(message, privateKey);
  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.update(0, (witness) => {
      const unsigned = blockchain.WitnessArgs.unpack(witness!);
      unsigned.lock = sig;
      return bytes.hexify(blockchain.WitnessArgs.pack(unsigned));
    })
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptHash: computeScriptHash(lock),
    scriptGroupType: "lock",
  });

  console.assert(result.code === 0);

  console.log("Cycles consumed", result.cycles);
  console.log(result.message);
}

main();
