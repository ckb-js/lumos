import { PackParam } from "@ckb-lumos/codec";
import { Address, Script, blockchain } from "@ckb-lumos/base";
import { predefined } from "@ckb-lumos/config-manager";
import { parseAddress } from "../";
import { createModelHelper } from "./base";

export type PackableScript = PackParam<typeof blockchain.Script>;
export type ScriptLike = PackableScript | Address;

function autoParseAddress(address: Address): Script {
  if (address.startsWith("ckb")) {
    return parseAddress(address, { config: predefined.LINA });
  } else if (address.startsWith("ckt")) {
    return parseAddress(address, { config: predefined.AGGRON4 });
  }

  throw new Error(`The address prefix ${address} is unknown`);
}

export const scriptHelper = createModelHelper<Script, ScriptLike>({
  pack: (val) =>
    blockchain.Script.pack(
      typeof val === "string" ? autoParseAddress(val) : val
    ),

  unpack: (val) => blockchain.Script.unpack(val),
});
