import { commons, config, hd, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { bytes } from "@ckb-lumos/lumos/codec";

const CONFIG = config.predefined.AGGRON4;
const PRIVATE_KEY = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const fromLock = {
  codeHash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
  hashType: CONFIG.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
  args: hd.key.privateKeyToBlake160(PRIVATE_KEY),
};
const fromAddress = helpers.encodeToAddress(fromLock, { config: CONFIG });

async function main() {
  // always success binary in hex format
  // the same with bytes.hexify(fs.readFileSync("always_success"))
  const alwaysSuccess = bytes.bytify(
    "0x7f454c460201010000000000000000000200f3000100000078000100000000004000000000000000980000000000000005000000400038000100400003000200010000000500000000000000000000000000010000000000000001000000000082000000000000008200000000000000001000000000000001459308d00573000000002e7368737472746162002e74657874000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b000000010000000600000000000000780001000000000078000000000000000a0000000000000000000000000000000200000000000000000000000000000001000000030000000000000000000000000000000000000082000000000000001100000000000000000000000000000001000000000000000000000000000000"
  );

  const indexer = new Indexer("https://testnet.ckb.dev");
  const rpc = new RPC("https://testnet.ckb.dev");

  let { txSkeleton, scriptConfig, typeId } = await commons.deploy.generateDeployWithTypeIdTx({
    scriptBinary: alwaysSuccess,
    config: CONFIG,
    feeRate: 1000n,
    cellProvider: indexer,
    fromInfo: fromAddress,
  });

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton, { config: CONFIG });

  const signature = hd.key.signRecoverable(txSkeleton.get("signingEntries").get(0)!.message!, PRIVATE_KEY);
  const signedTx = helpers.sealTransaction(txSkeleton, [signature]);

  const txHash = await rpc.sendTransaction(signedTx);
  console.log(txHash, scriptConfig, typeId);
}

main();
