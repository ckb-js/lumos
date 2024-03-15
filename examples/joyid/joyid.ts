import { getJoyIDLockScript, RSA2048_PUBKEY_SIG_LEN } from "@nervina-labs/joyid-sdk";
import { blockchain, bytes } from "@ckb-lumos/lumos/codec";
import { registerCustomLockScriptInfos } from "@ckb-lumos/lumos/common-scripts/common";
import { WitnessArgs, commons, helpers, Script, Cell } from "@ckb-lumos/lumos";
import { CKBComponents } from "@ckb-lumos/lumos/rpc";

export interface CellCollector {
  collect(): AsyncIterable<Cell>;
}

export interface CellProvider {
  uri?: string;
  collector(queryOptions: CKBComponents.QueryOptions): CellCollector;
}

class JoyIDCellCollector {
  readonly fromScript: Script;
  private readonly cellCollector: CellCollector;

  constructor(
    fromAddr: string,
    cellProvider: CellProvider,
    { queryOptions = {} }: { queryOptions: CKBComponents.QueryOptions }
  ) {
    if (!cellProvider) {
      throw new Error(`cellProvider is required when collecting JoyID-related cells`);
    }

    this.fromScript = helpers.parseAddress(fromAddr);

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
}

function createJoyIDScriptInfo(): commons.LockScriptInfo {
  return {
    codeHash: getJoyIDLockScript().codeHash,
    hashType: "type",
    lockScriptInfo: {
      CellCollector: JoyIDCellCollector,
      prepareSigningEntries: null,
      async setupInputCell(txSkeleton, inputCell, _, options = {}) {
        const template = getJoyIDLockScript();

        const fromScript = inputCell.cellOutput.lock;
        asserts(bytes.equal(fromScript.codeHash, template.codeHash), `The input script is not Unipass script`);
        // add inputCell to txSkeleton
        txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(inputCell));

        const output: Cell = {
          cellOutput: {
            capacity: inputCell.cellOutput.capacity,
            lock: inputCell.cellOutput.lock,
            type: inputCell.cellOutput.type,
          },
          data: inputCell.data,
        };

        txSkeleton = txSkeleton.update("outputs", (outputs) => {
          return outputs.push(output);
        });

        const since = options.since;
        if (since) {
          txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
            return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
          });
        }

        txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
          return witnesses.push("0x");
        });

        if (!template) {
          throw new Error(`UNIPASS script not defined in config!`);
        }

        // add cell dep
        txSkeleton = helpers.addCellDep(txSkeleton, {
          outPoint: {
            txHash: "0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263",
            index: "0x0",
          },
          depType: "depGroup",
        });

        // add witness
        /*
         * Modify the skeleton, so the first witness of the fromAddress script group
         * has a WitnessArgs construct with 85-byte zero filled values. While this
         * is not required, it helps in transaction fee estimation.
         */
        const firstIndex = txSkeleton
          .get("inputs")
          .findIndex((input) =>
            bytes.equal(blockchain.Script.pack(input.cellOutput.lock), blockchain.Script.pack(fromScript))
          );
        if (firstIndex !== -1) {
          while (firstIndex >= txSkeleton.get("witnesses").size) {
            txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
          }
          let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
          const newWitnessArgs: WitnessArgs = {
            lock: bytes.hexify(new Uint8Array(RSA2048_PUBKEY_SIG_LEN)),
          };
          witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
          txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
        }

        return txSkeleton;
      },
    },
  };
}

function asserts(condition: unknown, message = "Assert failed"): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

registerCustomLockScriptInfos([createJoyIDScriptInfo()]);
