import { blockchain, bytes } from "@ckb-lumos/lumos/codec";
import { WitnessArgs, commons, helpers, Script, Cell, utils } from "@ckb-lumos/lumos";
import { CKBComponents } from "@ckb-lumos/lumos/rpc";
import { getJoyIDLockScript, getJoyIDCellDep, Aggregator, getConfig, connect } from "@joyid/ckb";
import { getCotaTypeScript } from "./constants";

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

type Connection = Awaited<ReturnType<typeof connect>>;

export function createJoyIDScriptInfo(config: { connection: Connection }): commons.LockScriptInfo {
  return {
    codeHash: getJoyIDLockScript(false).codeHash,
    hashType: "type",
    lockScriptInfo: {
      CellCollector: JoyIDCellCollector,
      prepareSigningEntries: null,
      async setupInputCell(txSkeleton, inputCell, _, options = {}) {
        const template = getJoyIDLockScript(false);

        const fromScript = inputCell.cellOutput.lock;
        asserts(bytes.equal(fromScript.codeHash, template.codeHash), `The input script is not JoyID script`);
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

        if (!template) {
          throw new Error(`JoyID script not defined in config!`);
        }

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

          const connection = config.connection;
          console.log("JoyID config: ", getConfig());
          console.log("JoyID connection: ", connection);

          const lock = helpers.parseAddress(connection.address);

          // will change if the connection.keyType is a sub_key
          let newWitnessArgs: WitnessArgs = {
            lock: "0x",
          };

          if (connection.keyType === "sub_key") {
            const aggregator = new Aggregator("https://cota.nervina.dev/aggregator");

            const pubkeyHash = bytes.bytify(utils.ckbHash("0x" + connection.pubkey)).slice(0, 20);

            const { unlock_entry: unlockEntry } = await aggregator.generateSubkeyUnlockSmt({
              // TODO TBD
              alg_index: 1,
              pubkey_hash: bytes.hexify(pubkeyHash),
              lock_script: bytes.hexify(blockchain.Script.pack(lock)),
            });
            newWitnessArgs = {
              lock: "0x",
              inputType: "0x",
              outputType: "0x" + unlockEntry,
            };

            const cotaType = getCotaTypeScript(getConfig().network === "mainnet");
            const cotaCollector = txSkeleton.get("cellProvider").collector({ lock: lock, type: cotaType });

            let cotaCells: Cell[] = [];
            for await (const cotaCell of cotaCollector.collect()) {
              cotaCells.push(cotaCell);
            }

            if (!cotaCells || cotaCells.length === 0) {
              throw new Error("Cota cell doesn't exist");
            }
            const cotaCell = cotaCells[0];
            const cotaCellDep: CKBComponents.CellDep = {
              outPoint: cotaCell.outPoint,
              depType: "code",
            };

            // note: COTA cell MUST put first
            txSkeleton = helpers.addCellDep(txSkeleton, cotaCellDep);
          }

          txSkeleton = helpers.addCellDep(txSkeleton, getJoyIDCellDep(false));

          const witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
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
