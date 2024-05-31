import test from "ava";
import { refreshTypeIdCellDeps } from "../src/refresh";
import { randomBytes } from "@ckb-lumos/crypto";
import { TransactionSkeleton } from "../src";
import { CellDep } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

test("refreshTypeIdCellDeps", async (t) => {
  const outdatedCellDep: CellDep = {
    outPoint: { index: "0x0", txHash: bytes.hexify(randomBytes(32)) },
    depType: "code",
  };
  const latestCellDep: CellDep = {
    outPoint: { index: "0x0", txHash: bytes.hexify(randomBytes(32)) },
    depType: "code",
  };

  const normalCellDep: CellDep = {
    outPoint: { index: "0x0", txHash: bytes.hexify(randomBytes(32)) },
    depType: "code",
  };

  const txSkeleton = TransactionSkeleton({}).asMutable();
  txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(outdatedCellDep, normalCellDep)
  );
  await refreshTypeIdCellDeps(txSkeleton, {
    resolve: (outPoints) =>
      outPoints.map((outPoint) => {
        if (outPoint.txHash === outdatedCellDep.outPoint.txHash) {
          return latestCellDep.outPoint;
        }
        return outPoint;
      }),
  });

  t.is(
    txSkeleton.cellDeps.get(0)?.outPoint.txHash,
    latestCellDep.outPoint.txHash
  );

  t.is(
    txSkeleton.cellDeps.get(1)?.outPoint.txHash,
    normalCellDep.outPoint.txHash
  );

  t.is(txSkeleton.cellDeps.size, 2);
});
