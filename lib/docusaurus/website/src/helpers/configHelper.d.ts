import { Address, config } from "@ckb-lumos/lumos";
export declare function toConfigWithoutShortId(configWithShortId: config.Config): config.Config;
export declare function hasShortId(address: Address, cfg: config.Config): boolean;
