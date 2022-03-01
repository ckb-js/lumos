import { struct } from "@ckb-lumos-experiment/molecule/lib/layout";
import {
  fixedHexBytes,
  Uint128LE,
  Uint32LE,
  Uint64LE,
} from "@ckb-lumos-experiment/molecule/lib/common";
import { BI } from "@ckb-lumos/bi";

// struct RawWithdrawalRequest {
//     nonce: Uint32,
//     // CKB amount
//     capacity: Uint64,
//     // SUDT amount
//     amount: Uint128,
//     sudt_script_hash: Byte32,
//     // layer2 account_script_hash
//     account_script_hash: Byte32,
//     // buyer can pay sell_amount and sell_capacity to unlock
//     sell_amount: Uint128,
//     sell_capacity: Uint64,
//     // layer1 lock to withdraw after challenge period
//     owner_lock_hash: Byte32,
//     // layer1 lock to receive the payment, must exists on the chain
//     payment_lock_hash: Byte32,
//     // withdrawal fee, paid to block producer
//     fee: Fee,
// }
// struct Fee {
//     sudt_id: Uint32,
//     amount: Uint128,
// }

const Bytes32 = fixedHexBytes(32);

const Fee = struct(
  {
    sudt_id: Uint32LE,
    amount: Uint128LE,
  },
  ["sudt_id", "amount"]
);

const RawWithdrawalRequest = struct(
  {
    nonce: Uint32LE,
    capacity: Uint64LE,
    amount: Uint128LE,
    sudt_script_hash: Bytes32,
    account_script_hash: Bytes32,
    sell_amount: Uint128LE,
    sell_capacity: Uint64LE,
    owner_lock_hash: Bytes32,
    payment_lock_hash: Bytes32,
    fee: Fee,
  },
  [
    "nonce",
    "capacity",
    "amount",
    "sudt_script_hash",
    "account_script_hash",
    "sell_amount",
    "sell_capacity",
    "owner_lock_hash",
    "payment_lock_hash",
    "fee",
  ]
);

RawWithdrawalRequest.pack({
  nonce: 1,
  capacity: BI.from(10000),
  amount: BI.from(1000),
  sudt_script_hash:
    "0x1234567812345678123456781234567812345678123456781234567812345678",
  account_script_hash:
    "0x1234567812345678123456781234567812345678123456781234567812345678",
  owner_lock_hash:
    "0x1234567812345678123456781234567812345678123456781234567812345678",
  payment_lock_hash:
    "0x1234567812345678123456781234567812345678123456781234567812345678",
  sell_amount: BI.from(1000),
  sell_capacity: BI.from(100),
  fee: {
    sudt_id: 1,
    amount: BI.from(1000),
  },
});
