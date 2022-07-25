import { Script } from "@ckb-lumos/base";
import { RPCType } from "./rpcType";

const toScript = (data: Script): RPCType.Script => ({
  code_hash: data.codeHash,
  hash_type: data.hashType,
  args: data.args
})
export {
  toScript
};
