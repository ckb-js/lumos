import {
  Byte32,
  Bytes,
  createObjectCodec,
  enhancePack,
  struct,
  table,
  Uint32BE,
  Uint64,
  Uint8,
} from "../src";
import { concatBuffer, toArrayBuffer } from "../src/utils";

// https://github.com/nervosnetwork/godwoken/blob/90ecd3b58e1f25fe83ef74090e5bca83287ca2eb/crates/rpc-client/src/withdrawal.rs#L36-L71
// godwoken-v1 withdrawal cell lock args
// rollup_type_hash | WithdrawalLockArgs | owner_lock_len_u32be | Script

// https://github.com/nervosnetwork/godwoken-scripts/blob/81676d9d53ffdf5bbaa60483928d07da16eb4a88/c/godwoken.mol#L196-L202
// struct WithdrawalLockArgs {
//     withdrawal_block_hash: Byte32,
//     withdrawal_block_number: Uint64,
//     account_script_hash: Byte32,
//     // layer1 lock to withdraw after challenge period
//     owner_lock_hash: Byte32,
// }

const RollupTypeHash = Byte32;

const WithdrawalLockArgs = struct(
  {
    withdrawal_block_hash: Byte32,
    withdrawal_block_number: Uint64,
    account_script_hash: Byte32,
    // layer1 lock to withdraw after
    owner_lock_hash: Byte32,
  },
  [
    "withdrawal_block_hash",
    "withdrawal_block_number",
    "account_script_hash",
    "owner_lock_hash",
  ]
);

const Script = table(
  {
    code_hash: Byte32,
    hash_type: Uint8,
    args: Bytes,
  },
  ["code_hash", "hash_type", "args"]
);

const FullWithdrawalWithdrawalObjectArgsCodec = createObjectCodec({
  rollup_type_hash: RollupTypeHash,
  withdrawal_lock_args: WithdrawalLockArgs,
  owner_lock_len: Uint32BE,
  owner_lock: Script,
});

function sliceBuffer(buf: ArrayBuffer, lengths: number[]): ArrayBuffer[] {
  let offset = 0;
  const result: ArrayBuffer[] = [];
  lengths.forEach((length) => {
    const slice = buf.slice(offset, offset + length);
    result.push(slice);
    offset += length;
  });
  result.push(buf.slice(offset));
  return result;
}

const WithdrawalCodec = enhancePack(
  FullWithdrawalWithdrawalObjectArgsCodec,
  (obj) =>
    concatBuffer(
      obj.rollup_type_hash,
      obj.withdrawal_lock_args,
      obj.owner_lock_len,
      obj.owner_lock
    ),
  (buf) => {
    const [
      rollup_type_hash,
      withdrawal_lock_args,
      owner_lock_len,
      owner_lock,
    ] = sliceBuffer(buf, [
      32 /* rollup_type_hash */,
      WithdrawalLockArgs.byteLength /* withdrawal_lock_args */,
      4 /* owner_lock_len */,
    ]);

    return {
      rollup_type_hash,
      withdrawal_lock_args,
      owner_lock_len,
      owner_lock,
    };
  }
);

const obj = WithdrawalCodec.unpack(
  toArrayBuffer(
    // https://explorer.nervos.org/aggron/transaction/0x3366c7b1b764350e90e8b260813f82fc4582d6dad0803ad3549b50b89b725931
    "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a575d9e7e6919ddf4088ce9fae863db90d447c434f2ab12b575eda2f81ae5884b1d90d8a0000000000000dd4787f79c37a98e066ace8c0c96d05804b90922b9d9849f395f0bad2e1b5db17c2cc949b24bbc469d20617839cfabc0665e379dee18eae03a77801f8eb09410000004b4b00000010000000300000003100000079f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e011600000001c094f55971bbf9974bea6bd7b9d4c35f6b5437dc00"
  )
);

console.log(obj);
