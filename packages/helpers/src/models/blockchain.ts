import { blockchain } from "@ckb-lumos/base";
import { createModelHelper } from "./base";

/**
 * {@link ModelHelper}
 */
export const outPointHelper = createModelHelper(blockchain.OutPoint);
