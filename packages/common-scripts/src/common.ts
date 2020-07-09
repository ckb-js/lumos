import {
  parseAddress,
  generateAddress,
  TransactionSkeletonType,
  Options,
} from "@ckb-lumos/helpers";
import secp256k1Blake160Multisig, {
  FromInfo,
} from "./secp256k1_blake160_multisig";
import secp256k1Blake160 from "./secp256k1_blake160";
import {
  isSecp256k1Blake160Address,
  isSecp256k1Blake160MultisigAddress,
  prepareSigningEntries as _prepareSigningEntries,
} from "./helper";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import lockTimePool from "./locktime_pool";
import { Address, Header } from "@ckb-lumos/base";

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address,
  amount: bigint,
  tipHeader: Header | undefined,
  {
    config,
    requireToAddress,
    useLocktimeCellsFirst,
  }: {
    config?: Config;
    requireToAddress?: true;
    useLocktimeCellsFirst?: boolean;
  }
): Promise<TransactionSkeletonType>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader: Header | undefined,
  {
    config,
    requireToAddress,
    useLocktimeCellsFirst,
  }: {
    config?: Config;
    requireToAddress: false;
    useLocktimeCellsFirst?: boolean;
  }
): Promise<TransactionSkeletonType>;

/**
 *
 * @param txSkeleton
 * @param fromInfos
 * @param toAddress
 * @param amount
 * @param tipHeader will not use locktime cells if tipHeader not provided
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader?: Header,
  {
    config = undefined,
    requireToAddress = true,
    useLocktimeCellsFirst = true,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    useLocktimeCellsFirst?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  amount = BigInt(amount);
  let deductAmount = BigInt(amount);

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  if (useLocktimeCellsFirst) {
    // if provider tipHeader
    if (tipHeader) {
      [txSkeleton, deductAmount] = await lockTimePool.transfer(
        txSkeleton,
        fromInfos,
        toAddress,
        deductAmount,
        tipHeader,
        { config, requireToAddress, assertAmountEnough: false }
      );
    }

    if (deductAmount > 0n) {
      [txSkeleton, deductAmount] = await _commonTransfer(
        txSkeleton,
        fromInfos,
        deductAmount === amount ? toAddress : undefined,
        deductAmount,
        {
          config,
        }
      );
    }
  } else {
    [txSkeleton, deductAmount] = await _commonTransfer(
      txSkeleton,
      fromInfos,
      deductAmount === amount ? toAddress : undefined,
      deductAmount,
      {
        config,
      }
    );

    if (tipHeader && deductAmount > 0n) {
      // if provider tipHeader
      [txSkeleton, deductAmount] = await lockTimePool.transfer(
        txSkeleton,
        fromInfos,
        toAddress,
        deductAmount,
        tipHeader,
        { config, requireToAddress, assertAmountEnough: false }
      );
    }
  }

  if (deductAmount > 0n) {
    throw new Error("Not enough capacity in from infos!");
  }

  return txSkeleton;
}

export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  return transfer(txSkeleton, fromInfos, undefined, amount, tipHeader, {
    config,
    requireToAddress: false,
    useLocktimeCellsFirst,
  });
}

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();
  txSkeleton = _prepareSigningEntries(txSkeleton, config, "SECP256K1_BLAKE160");
  txSkeleton = _prepareSigningEntries(
    txSkeleton,
    config,
    "SECP256K1_BLAKE160_MULTISIG"
  );
  return txSkeleton;
}

async function _commonTransfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined, // can be empty
  amount: bigint,
  { config = undefined }: Options = {}
): Promise<[TransactionSkeletonType, bigint]> {
  config = config || getConfig();
  amount = BigInt(amount);
  for (const [index, fromInfo] of fromInfos.entries()) {
    const addr = index === 0 ? toAddress : undefined;
    if (
      typeof fromInfo === "string" &&
      isSecp256k1Blake160Address(fromInfo, config)
    ) {
      const result = await secp256k1Blake160.transfer(
        txSkeleton,
        fromInfo,
        addr,
        amount,
        {
          config,
          requireToAddress: false,
          assertAmountEnough: false,
        }
      );
      txSkeleton = result[0];
      amount = result[1];
    } else if (
      typeof fromInfo === "string" &&
      isSecp256k1Blake160MultisigAddress(fromInfo, config)
    ) {
      const fromScript = parseAddress(fromInfo, { config });
      const fromAddress = generateAddress(
        {
          code_hash: fromScript.code_hash,
          hash_type: fromScript.hash_type,
          args: fromScript.args.slice(0, 42),
        },
        { config }
      );
      const result = await secp256k1Blake160Multisig.transfer(
        txSkeleton,
        fromAddress,
        addr,
        amount,
        {
          config,
          requireToAddress: false,
          assertAmountEnough: false,
        }
      );
      txSkeleton = result[0];
      amount = result[1];
    } else if (typeof fromInfo === "object") {
      const result = await secp256k1Blake160Multisig.transfer(
        txSkeleton,
        fromInfo,
        addr,
        amount,
        {
          config,
          requireToAddress: false,
          assertAmountEnough: false,
        }
      );
      txSkeleton = result[0];
      amount = result[1];
    } else {
      throw new Error("Not supported fromInfo!");
    }
  }

  return [txSkeleton, amount];
}

export default {
  transfer,
  payFee,
  prepareSigningEntries,
  __tests__: {
    _commonTransfer,
  },
};
