const { parseAddress, generateAddress } = require("@ckb-lumos/helpers");
const secp256k1Blake160Multisig = require("./secp256k1_blake160_multisig");
const secp256k1Blake160 = require("./secp256k1_blake160");
const {
  isSecp256k1Blake160Address,
  isSecp256k1Blake160MultisigAddress,
} = require("./helper");
const { getConfig } = require("@ckb-lumos/config-manager");
const lockTimePool = require("./locktime_pool");

async function transfer(
  txSkeleton,
  fromInfos,
  toAddress,
  amount,
  tipHeader,
  { config = undefined, requireToAddress = true }
) {
  amount = BigInt(amount);
  let deductAmount = BigInt(amount);

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

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
      deductAmount === amount ? toAddress : null,
      deductAmount,
      {
        config,
        requireToAddress: false,
      }
    );
  }

  if (deductAmount > 0n) {
    throw new Error("Not enough capacity in from infos!");
  }

  return txSkeleton;
}

async function _commonTransfer(
  txSkeleton,
  fromInfos,
  toAddress, // can be empty
  amount,
  { config = undefined }
) {
  config = config || getConfig();
  amount = BigInt(amount);
  for (const [index, fromInfo] of fromInfos.entries()) {
    const addr = index === 0 ? toAddress : null;
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
        {
          R: fromInfo.R,
          M: fromInfo.M,
          publicKeyHashes: fromInfo.publicKeyHashes,
        },
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

module.exports = {
  transfer,
  __tests__: {
    _commonTransfer,
  },
};
