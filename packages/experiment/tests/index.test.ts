import { createScriptRegistry } from "../src";
import test from "ava";
import { predefined } from "@ckb-lumos/config-manager";
import { Reader } from "@ckb-lumos/toolkit";
const { AGGRON4 } = predefined;

test("ScriptRegistry", (t) => {
  const registry = createScriptRegistry(AGGRON4.SCRIPTS);

  const secp256k1Script = registry.newScript("SECP256K1_BLAKE160", "0x");
  const SECP256K1_BLAKE160_SCRIPT = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as const,
    args: "0x",
  };
  t.deepEqual(secp256k1Script, SECP256K1_BLAKE160_SCRIPT);

  const multiSigScript = registry.newScript(
    "SECP256K1_BLAKE160_MULTISIG",
    new Reader("0x")
  );
  const SECP256K1_BLAKE160_MULTISIG_SCRIPT = {
    code_hash:
      "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hash_type: "type",
    args: new Reader("0x").serializeJson(),
  };
  t.deepEqual(multiSigScript, SECP256K1_BLAKE160_MULTISIG_SCRIPT);

  const newRegistry = registry.extend({
    OMNI_LOCK: {
      CODE_HASH:
        "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
      HASH_TYPE: "type",
      TX_HASH:
        "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  });
  const omniCellDep = newRegistry.newCellDep("OMNI_LOCK");
  const OMNI_CELL_DEP = {
    out_point: {
      tx_hash:
        "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      index: "0x0",
    },
    dep_type: "code",
  };
  t.deepEqual(omniCellDep, OMNI_CELL_DEP);

  const isSecp256k1 = newRegistry.isScriptOf(
    "SECP256K1_BLAKE160",
    SECP256K1_BLAKE160_SCRIPT
  );
  t.is(isSecp256k1, true);
  const isMultiSig = newRegistry.isScriptOf(
    "SECP256K1_BLAKE160_MULTISIG",
    SECP256K1_BLAKE160_SCRIPT
  );
  t.is(isMultiSig, false);
});
