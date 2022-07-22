import { OutPoint } from "@ckb-lumos/base";
import { TestContext } from "./types";
export declare function mockOutPoint(): OutPoint;
declare type DepCodePath = {
    depType?: "code";
    path: string;
};
declare type DepGroupPath = {
    depType: "depGroup";
    path: string;
    includes: string[];
};
declare type LocaleConfig = DepCodePath | DepGroupPath;
export declare type LocaleCode = {
    [key: string]: LocaleConfig;
};
export declare type CreateContextOptions = {
    codeLocale: LocaleCode;
};
export declare function createTestContext<Code extends LocaleCode>(config: {
    deps: Code;
}): TestContext<Code>;
export declare function getDefaultConfig(): {
    deps: LocaleCode;
};
export {};
