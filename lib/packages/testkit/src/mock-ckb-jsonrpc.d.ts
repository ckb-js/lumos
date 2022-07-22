import { Express } from "express";
import { LocalNode, Block } from "@ckb-lumos/base";
interface Options {
    blocks: Block[];
    localNode: LocalNode;
    routePath?: string;
}
export declare function createCKBMockRPC(options: Options): Express;
export {};
