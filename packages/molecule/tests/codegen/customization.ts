import { molecule } from "@ckb-lumos/codec";

// the compiler does not support empty block declaration
// so the Table0 is manually declared
export const Table0 = molecule.table({}, []);
