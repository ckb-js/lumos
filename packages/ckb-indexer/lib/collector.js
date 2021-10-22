"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerCollector = exports.Collector = void 0;
const base_1 = require("@ckb-lumos/base");
const ckb_js_toolkit_1 = require("ckb-js-toolkit");
const immutable_1 = require("immutable");
const indexer_1 = require("./indexer");
// import { logger } from "./logger";
const indexer_2 = require("./indexer");
class Collector {
}
exports.Collector = Collector;
class IndexerCollector extends base_1.BaseCellCollector {
    constructor(indexer, queries) {
        super();
        this.indexer = indexer;
        this.queries = queries;
        const { lock = null, type = null, argsLen = -1, data = "any", fromBlock = null, toBlock = null, order = indexer_1.Order.asc, skip = null, } = queries;
        if (!lock && (!type || type === "empty")) {
            throw new Error("Either lock or type script must be provided!");
        }
        function instanceOfScriptWrapper(object) {
            return 'script' in object;
        }
        // unWrap `ScriptWrapper` into `Script`.
        if (lock) {
            if (!instanceOfScriptWrapper(lock)) {
                ckb_js_toolkit_1.validators.ValidateScript(lock);
                this.lock = lock;
            }
            else if (instanceOfScriptWrapper(lock)) {
                ckb_js_toolkit_1.validators.ValidateScript(lock.script);
                this.lock = lock.script;
            }
        }
        // unWrap `ScriptWrapper` into `Script`.
        if (type) {
            if (type === 'empty') {
                this.type = 'empty';
            }
            if (typeof type === "object" && !instanceOfScriptWrapper(type)) {
                ckb_js_toolkit_1.validators.ValidateScript(type);
                this.type = type;
            }
            else if (typeof type === "object" && instanceOfScriptWrapper(type)) {
                ckb_js_toolkit_1.validators.ValidateScript(type.script);
                this.type = type.script;
            }
        }
        if (fromBlock) {
            base_1.utils.assertHexadecimal("fromBlock", fromBlock);
        }
        if (toBlock) {
            base_1.utils.assertHexadecimal("toBlock", toBlock);
        }
        if (order !== indexer_1.Order.asc && order !== indexer_1.Order.desc) {
            throw new Error("Order must be either asc or desc!");
        }
        this.indexer = indexer;
        this.data = data;
        this.fromBlock = fromBlock;
        this.toBlock = toBlock;
        this.order = order;
        this.skip = skip;
        this.argsLen = argsLen;
    }
    async getLiveCell() {
        let block_range = null;
        let lockOutPoints = null;
        let typeOutPoints = null;
        if (this.fromBlock && this.toBlock) {
            //TODO this.toBlock+1
            block_range = [this.fromBlock, this.toBlock];
        }
        // TODO add output_data_len_range and output_capacity_range limit
        // output_data_len_range: [u64; 2], filter cells by output data len range, [inclusive, exclusive]
        // output_capacity_range: [u64; 2], filter cells by output capacity range, [inclusive, exclusive]
        const additionalOptions = {
            // sizeLimit: this.sizeLimit,
            order: this.order
        };
        if (this.lock) {
            const searchKey = {
                script: this.lock,
                script_type: indexer_2.ScriptType.lock,
                filter: {
                    script: this.lock,
                }
            };
            if (block_range) {
                searchKey.filter = { ...searchKey.filter, block_range };
            }
            const outPoints = await this.indexer.getCells(searchKey, undefined, additionalOptions);
            lockOutPoints = this.wrapOutPoints(outPoints);
        }
        else if (this.type && this.type !== 'empty') {
            const searchKey = {
                script: this.type,
                script_type: indexer_2.ScriptType.type,
                filter: {
                    script: this.type,
                }
            };
            if (block_range) {
                searchKey.filter = { ...searchKey.filter, block_range };
            }
            const outPoints = await this.indexer.getCells(searchKey, undefined, additionalOptions);
            typeOutPoints = this.wrapOutPoints(outPoints);
        }
        let outPoints = null;
        if (lockOutPoints && typeOutPoints) {
            outPoints = lockOutPoints.intersect(typeOutPoints);
        }
        else if (lockOutPoints) {
            outPoints = lockOutPoints;
        }
        else {
            outPoints = typeOutPoints;
        }
        return outPoints;
    }
    wrapOutPoints(outPoints) {
        let outPointsBufferValue = (0, immutable_1.OrderedSet)();
        for (const o of outPoints) {
            outPointsBufferValue = outPointsBufferValue.add(o);
        }
        return outPointsBufferValue;
    }
    async count() {
        let cells = await this.getLiveCell();
        let counter = 0;
        if (!cells)
            return counter;
        for (const cell of cells) {
            if (cell && this.type === "empty" && cell.cell_output.type) {
                continue;
            }
            if (this.data !== "any" && cell.data !== this.data) {
                continue;
            }
            counter += 1;
        }
        return counter;
    }
    // async *collect() {
    //   let cells = await this.getLiveCell();
    //   if(!cells) {
    //     yield 
    //     return
    //   }
    //   for (const cell of cells) {
    //     if (cell && this.type === "empty" && cell.cell_output.type) {
    //       continue;
    //     }
    //     if (this.data !== "any" && cell.data !== this.data) {
    //       continue;
    //     }
    //     yield cell;
    //   }
    // }
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
            script_type: indexer_2.ScriptType.lock,
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
            script_type: indexer_2.ScriptType.lock,
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
            script_type: indexer_2.ScriptType.lock,
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
            script_type: indexer_2.ScriptType.lock,
        };
        const cells = await this.indexer.getCells(searchKey, terminator);
        return cells;
    }
}
exports.IndexerCollector = IndexerCollector;
//# sourceMappingURL=collector.js.map