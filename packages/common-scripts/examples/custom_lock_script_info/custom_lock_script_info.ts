import {
  Cell,
  CellCollector,
  CellProvider,
  QueryOptions,
  blockchain,
} from "@ckb-lumos/base";
import * as apiTypes from "@ckb-lumos/base/lib/api";
import { BI } from "@ckb-lumos/bi";
import * as codec from "@ckb-lumos/codec";
import { getConfig } from "@ckb-lumos/config-manager";
import { Options, TransactionSkeletonType } from "@ckb-lumos/helpers";
import { List, Map } from "immutable";
import * as commons from "../../src";
import { addCellDep } from "../../src/helper";

// Compare two objects by convert them to molecule buffer to ignore the representation only
// differences.
function isSameScript(a: apiTypes.Script, b: apiTypes.Script) {
  return (
    codec.bytes.hexify(blockchain.Script.pack(a)) ===
    codec.bytes.hexify(blockchain.Script.pack(b))
  );
}

const MAX_U64_PLUS_ONE = BI.from(1).shl(64);
function packInt64LE(number: BI) {
  return codec.number.Uint64LE.pack(
    number.isNegative() ? MAX_U64_PLUS_ONE.add(number) : number
  );
}

// This example demonstrates how to use a custom script [CapacityDiff](https://github.com/doitian/ckb-sdk-examples-capacity-diff).
//
// CapacityDiff verifies the witness matches the capacity difference.
//
// -   The script loads the witness for the first input in the script group using the WitnessArgs layout.
// -   The total input capacity is the sum of all the input cells in the script group.
// -   The total output capacity is the sum of all the output cells having the same lock script as the script group.
// -   The capacity difference is a 64-bit signed integer which equals to total output capacity minus total input capacity.
// -   The witness is encoded using two's complement and little endian.
const capacityDiffLockInfo: commons.LockScriptInfo = {
  codeHash: "0x",
  hashType: "type",
  lockScriptInfo: {
    CellCollector: class {
      cellCollector: CellCollector;
      fromScript = {
        codeHash: "0x",
        hashType: "type" as apiTypes.HashType,
        args: "0x",
      };

      constructor(
        fromInfo: commons.FromInfo,
        cellProvider: CellProvider,
        { config, queryOptions }: Options & { queryOptions?: QueryOptions }
      ) {
        if (!cellProvider) {
          throw new Error(`Cell provider is missing!`);
        }
        config ??= getConfig();
        const script = commons.parseFromInfo(fromInfo, { config }).fromScript;

        // Please note that the cell collector is called for each specific fromInfo.
        // Be cautious not to include input cells for accounts that are not locked by this script.
        const template = config.SCRIPTS.CAPACITY_DIFF!;
        if (
          script.codeHash !== template.CODE_HASH ||
          script.hashType !== template.HASH_TYPE
        ) {
          return;
        }

        // Now we can apply the queryOptions to search the live cells.
        queryOptions ??= {};
        queryOptions = {
          ...queryOptions,
          lock: script,
          type: queryOptions.type ?? "empty",
        };

        this.cellCollector = cellProvider.collector(queryOptions);
      }

      async *collect() {
        if (this.cellCollector) {
          for await (const inputCell of this.cellCollector.collect()) {
            yield inputCell;
          }
        }
      }
    },

    // What to do when a inputCell has been found by the cell provider.
    // - Add input and output cell
    // - Add cell deps.
    // - Fill witness to make fee calculation correct.
    setupInputCell: async (
      txSkeleton: TransactionSkeletonType,
      inputCell: Cell,
      _fromInfo: commons.FromInfo,
      { config, since, defaultWitness } = {}
    ) => {
      // use default config when config is not provided
      config ??= getConfig();
      const fromScript = inputCell.cellOutput.lock;
      const txMutable = txSkeleton.asMutable();

      //===========================
      // I. Common Skeletons
      //
      // There are many steps that setupInputCell must perform carefully, otherwise the whole transaction builder will fail.
      //===========================
      // 1.Add inputCell to txSkeleton
      txMutable.update("inputs", (inputs: List<Cell>) =>
        inputs.push(inputCell)
      );

      // 2. Add output. The function `lumos.commons.common.transfer` will scan outputs for available balance for each account.
      const outputCell = {
        cellOutput: {
          ...inputCell.cellOutput,
        },
        data: inputCell.data,
      };
      txMutable.update("outputs", (outputs: List<Cell>) =>
        outputs.push(outputCell)
      );

      // 3. Set Since
      if (since) {
        txMutable.setIn(
          ["inputSinces", txMutable.get("inputs").size - 1],
          since
        );
      }

      // 4. Insert a witness to ensure they are aligned to the location of the corresponding input cells.
      txMutable.update("witnesses", (witnesses: List<string>) =>
        witnesses.push(defaultWitness ?? "0x")
      );
      //=> Common Skeletons End Here

      //===========================
      // II. CellDeps
      //===========================
      // Assume that script onchain infos are stored as CAPACITY_DIFF
      const template = config.SCRIPTS.CAPACITY_DIFF;
      if (!template) {
        throw new Error(
          "Provided config does not have CAPACITY_DIFF script setup!"
        );
      }
      const scriptOutPoint = {
        txHash: template.TX_HASH,
        index: template.INDEX,
      };
      // The helper method addCellDep avoids adding duplicated cell deps.
      addCellDep(txMutable, {
        outPoint: scriptOutPoint,
        depType: template.DEP_TYPE,
      });

      //===========================
      // II. Witness Placeholder
      //===========================
      // Fill witness. These code are copied from
      // https://github.com/ckb-js/lumos/blob/1cb43fe72dc95c4b3283acccb5120b7bcaeb9346/packages/common-scripts/src/secp256k1_blake160.ts#L90
      //
      // It takes a lot of code to set the witness for the first input cell in
      // the script group to 8 bytes of zeros.
      const firstIndex = txMutable
        .get("inputs")
        .findIndex((input: Cell) =>
          isSameScript(input.cellOutput.lock, fromScript)
        );

      if (firstIndex !== -1) {
        // Ensure witnesses are aligned to inputs
        const toFillWitnessesCount =
          firstIndex + 1 - txMutable.get("witnesses").size;
        if (toFillWitnessesCount > 0) {
          txMutable.update("witnesses", (witnesses: List<string>) =>
            witnesses.concat(Array(toFillWitnessesCount).fill("0x"))
          );
        }
        txMutable.updateIn(["witnesses", firstIndex], (witness: any) => {
          const witnessArgs = {
            ...(witness === "0x"
              ? {}
              : blockchain.WitnessArgs.unpack(codec.bytes.bytify(witness))),
            lock: "0x0000000000000000",
          };
          return codec.bytes.hexify(blockchain.WitnessArgs.pack(witnessArgs));
        });
      }

      return txMutable.asImmutable();
    },

    // Create entries in txSkeleton.signingEntries
    prepareSigningEntries: (
      txSkeleton: TransactionSkeletonType,
      { config }
    ) => {
      // use default config when config is not provided
      config ??= getConfig();
      const template = config.SCRIPTS.CAPACITY_DIFF;
      if (!template) {
        throw new Error(
          `Provided config does not have CAPACITY_DIFF script setup!`
        );
      }

      const balances = Map<
        string,
        { index: number; capacity: BI }
      >().asMutable();
      // Group inputs by args and tally the total capacity as negative values.
      txSkeleton.get("inputs").forEach((input: Cell, index: number) => {
        const {
          capacity,
          lock: { codeHash, hashType, args },
        } = input.cellOutput;
        if (
          template.CODE_HASH === codeHash &&
          template.HASH_TYPE === hashType
        ) {
          if (balances.has(args)) {
            balances.updateIn([args, "capacity"], (total: any) =>
              total.sub(capacity)
            );
          } else {
            balances.set(args, { index, capacity: BI.from(0).sub(capacity) });
          }
        }
      });
      // Add capacity of output cells to the tally.
      txSkeleton.get("outputs").forEach((output: Cell) => {
        const {
          capacity,
          lock: { codeHash, hashType, args },
        } = output.cellOutput;
        if (
          template.CODE_HASH === codeHash &&
          template.HASH_TYPE === hashType &&
          balances.has(args)
        ) {
          balances.updateIn([args, "capacity"], (total: any) =>
            total.add(capacity)
          );
        }
      });
      // Create signing entries. Indeed, for this simple script, we could set
      // the witness directly. However, for serious lock script, it often
      // requires sining by the private
      // key.
      return txSkeleton.update(
        "signingEntries",
        (entries: List<{ index: number; type: string; message: string }>) =>
          entries.concat(
            balances
              .asImmutable()
              .valueSeq()
              .map(({ index, capacity }: any) => ({
                index,
                // This is the only supported type, which indicate the signature
                // follows the WitnewsArgs layout.
                type: "witness_args_lock",
                message: codec.bytes.hexify(packInt64LE(capacity)),
              }))
          )
      );
    },
  },
};

commons.common.registerCustomLockScriptInfos([capacityDiffLockInfo]);
