import { MultisigScript } from "@ckb-lumos/common-scripts/lib/from_info";
import { BIish } from "@ckb-lumos/bi";
interface Options {
    fromInfo: MultisigScript;
    toAddress: string;
    amount: BIish;
    privKeys: string[];
}
export declare function transfer(options: Options): Promise<string>;
export {};
