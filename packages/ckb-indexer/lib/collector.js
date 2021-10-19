"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerCollector = exports.Collector = void 0;
const base_1 = require("@ckb-lumos/base");
// import { logger } from "./logger";
const indexer_1 = require("./indexer");
class Collector {
}
exports.Collector = Collector;
class IndexerCollector extends Collector {
    constructor(indexer) {
        super();
        this.indexer = indexer;
    }
    async getCellsByLockscriptAndCapacity(lockscript, needCapacity) {
        let accCapacity = 0n;
        const terminator = (index, c) => {
            const cell = c;
            if (accCapacity >= needCapacity) {
                return { stop: true, push: false };
            }
            if (cell.data.length / 2 - 1 > 0 || cell.cell_output.type) {
                return { stop: false, push: false };
            }
            else {
                accCapacity += BigInt(cell.cell_output.capacity);
                return { stop: false, push: true };
            }
        };
        const searchKey = {
            script: lockscript,
            script_type: indexer_1.ScriptType.lock,
        };
        const cells = await this.indexer.getCells(searchKey, terminator);
        return cells;
    }
    async collectSudtByAmount(searchKey, amount) {
        let balance = 0n;
        const terminator = (index, c) => {
            const cell = c;
            if (balance >= amount) {
                return { stop: true, push: false };
            }
            else {
                const cellAmount = base_1.utils.readBigUInt128LE(cell.data);
                balance += cellAmount;
                return { stop: false, push: true };
            }
        };
        const cells = await this.indexer.getCells(searchKey, terminator);
        return cells;
    }
    async getBalance(lock) {
        const searchKey = {
            script: lock,
            script_type: indexer_1.ScriptType.lock,
        };
        const cells = await this.indexer.getCells(searchKey);
        let balance = 0n;
        cells.forEach((cell) => {
            balance += BigInt(cell.cell_output.capacity);
        });
        return balance;
    }
    async getSUDTBalance(sudtType, userLock) {
        const searchKey = {
            script: userLock,
            script_type: indexer_1.ScriptType.lock,
            filter: {
                script: sudtType,
            },
        };
        const cells = await this.indexer.getCells(searchKey);
        let balance = 0n;
        cells.forEach((cell) => {
            // logger.debug("cell.data:", cell.data);
            const amount = base_1.utils.readBigUInt128LE(cell.data);
            balance += amount;
        });
        return balance;
    }
    async getCellsByLockscriptAndCapacityWhenBurn(lockscript, recipientTypeCodeHash, needCapacity) {
        let accCapacity = 0n;
        const terminator = (index, c) => {
            const cell = c;
            if (accCapacity >= needCapacity) {
                return { stop: true, push: false };
            }
            if (cell.cell_output.type &&
                cell.cell_output.type.code_hash === recipientTypeCodeHash) {
                accCapacity += BigInt(cell.cell_output.capacity);
                return { stop: false, push: true };
            }
            if (cell.data.length / 2 - 1 > 0 || cell.cell_output.type !== undefined) {
                return { stop: false, push: false };
            }
            else {
                accCapacity += BigInt(cell.cell_output.capacity);
                return { stop: false, push: true };
            }
        };
        const searchKey = {
            script: lockscript,
            script_type: indexer_1.ScriptType.lock,
        };
        const cells = await this.indexer.getCells(searchKey, terminator);
        return cells;
    }
}
exports.IndexerCollector = IndexerCollector;
//# sourceMappingURL=collector.js.map