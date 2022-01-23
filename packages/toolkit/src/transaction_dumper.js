import JSBI from "jsbi";
import { Reader } from "./reader";
import { ValidateTransaction, ValidateOutPoint } from "./validators";

export class TransactionDumper {
  constructor(
    rpc,
    { validateTransaction = true, depGroupUnpacker = null } = {}
  ) {
    this.rpc = rpc;
    this.validateTransaction = validateTransaction;
    this.depGroupUnpacker = depGroupUnpacker;
  }

  async dumpByHash(txHash) {
    const tx = (await this.rpc.get_transaction(txHash)).transaction;
    delete tx.hash;
    return await this.dump(tx);
  }

  async dump(tx) {
    if (this.validateTransaction) {
      ValidateTransaction(tx);
    }
    const mockInputs = [];
    for (const input of tx.inputs) {
      const { output, data, header } = await this._resolveOutPoint(
        input.previous_output
      );
      mockInputs.push({ input, output, data, header });
    }
    const mockCellDeps = [];
    for (const cellDep of tx.cell_deps) {
      const { output, data, header } = await this._resolveOutPoint(
        cellDep.out_point
      );
      mockCellDeps.push({
        cell_dep: cellDep,
        output,
        data,
        header,
      });
      if (cellDep.dep_type === "dep_group") {
        if (!this.depGroupUnpacker) {
          throw new Error(
            "depGroupUnpacker must be provided when the transaction contains dep_group!"
          );
        }
        const outPoints = this.depGroupUnpacker(new Reader(data));
        for (const outPoint of outPoints) {
          ValidateOutPoint(outPoint);
          const { output, data, header } = await this._resolveOutPoint(
            outPoint
          );
          mockCellDeps.push({
            cell_dep: {
              out_point: outPoint,
              dep_type: "code",
            },
            output,
            data,
            header,
          });
        }
      }
    }
    const mockHeaderDeps = [];
    for (const headerDep of tx.header_deps) {
      mockHeaderDeps.push(await this.rpc.get_header(headerDep));
    }
    return JSON.stringify({
      mock_info: {
        inputs: mockInputs,
        cell_deps: mockCellDeps,
        header_deps: mockHeaderDeps,
      },
      tx,
    });
  }

  async _resolveOutPoint(out_point) {
    const txStatus = await this.rpc.get_transaction(out_point.tx_hash);
    if (!txStatus || !txStatus.transaction) {
      throw new Error(`Transaction ${out_point.tx_hash} cannot be found!`);
    }
    const tx = txStatus.transaction;
    const index = JSBI.toNumber(JSBI.BigInt(out_point.index));
    if (index >= tx.outputs.length) {
      throw new Error(
        `Transaction ${out_point.tx_hash} does not have output ${index}!`
      );
    }
    const data = {
      output: tx.outputs[index],
      data: tx.outputs_data[index],
    };
    if (txStatus.tx_status.status === "committed") {
      data.header = txStatus.tx_status.block_hash;
    }
    return data;
  }
}
