import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { secp256k1Blake160Multisig } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { AGGRON4 } = predefined;
import { Cell, values } from "@ckb-lumos/base";
import { bobMultisigInputs } from "./inputs";
import { bob } from "./account_info";

const cellProvider = new CellProvider(bobMultisigInputs);
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

test("setupInputCell", async (t) => {
  const inputCell: Cell = bobMultisigInputs[0];

  txSkeleton = await secp256k1Blake160Multisig.setupInputCell(
    txSkeleton,
    inputCell,
    bob.fromInfo,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  const input: Cell = txSkeleton.get("inputs").get(0)!;
  const output: Cell = txSkeleton.get("outputs").get(0)!;

  t.is(input.cell_output.capacity, output.cell_output.capacity);
  t.is(input.data, output.data);
  t.true(
    new values.ScriptValue(input.cell_output.lock, { validate: false }).equals(
      new values.ScriptValue(output.cell_output.lock, { validate: false })
    )
  );
  t.true(
    (!input.cell_output.type && !output.cell_output.type) ||
      new values.ScriptValue(input.cell_output.type!, {
        validate: false,
      }).equals(
        new values.ScriptValue(output.cell_output.type!, { validate: false })
      )
  );
});
