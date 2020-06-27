const { parseAddress, generateAddress } = require("@ckb-lumos/helpers");
const secp256k1Blake160Multisig = require("./secp256k1_blake160_multisig");
const secp256k1Blake160 = require("./secp256k1_blake160");
const {
  isSecp256k1Blake160Address,
  isSecp256k1Blake160MultisigAddress,
  prepareSigningEntries: _prepareSigningEntries,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
} = require("./helper");
const { getConfig } = require("@ckb-lumos/config-manager");
const lockTimePool = require("./locktime_pool");

async function transfer(
  txSkeleton,
  fromInfos,
  toAddress,
  amount,
  tipHeader,
  { config = undefined, requireToAddress = true, queryOptions = {} }
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
        queryOptions,
      }
    );
  }

  if (deductAmount > 0n) {
    throw new Error("Not enough capacity in from infos!");
  }

  return txSkeleton;
}

async function payFee(
  txSkeleton,
  fromInfos,
  amount,
  tipHeader,
  { config = undefined } = {}
) {
  return transfer(txSkeleton, fromInfos, null, amount, tipHeader, {
    config,
    requireToAddress: false,
  });
}

function prepareSigningEntries(txSkeleton, { config = undefined } = {}) {
  txSkeleton = _prepareSigningEntries(txSkeleton, config, "SECP256K1_BLAKE160");
  txSkeleton = _prepareSigningEntries(
    txSkeleton,
    config,
    "SECP256K1_BLAKE160_MULTISIG"
  );
  return txSkeleton;
}

async function _commonTransfer(
  txSkeleton,
  fromInfos,
  toAddress, // can be empty
  amount,
  { config = undefined, queryOptions = {} }
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
          queryOptions,
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
          queryOptions,
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
          queryOptions,
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

async function injectCapacity(
  txSkeleton,
  outputIndex,
  fromInfo,
  { config = undefined } = {}
) {
  config = config || getConfig();

  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }

  const output = txSkeleton.get("outputs").get(outputIndex);
  const lockScript = output.cell_output.lock;

  if (
    typeof fromInfo === "string" &&
    isSecp256k1Blake160Script(lockScript, config)
  ) {
    return secp256k1Blake160.injectCapacity(txSkeleton, outputIndex, fromInfo, {
      config,
    });
  } else if (
    typeof fromInfo === "object" ||
    (typeof fromInfo === "string" &&
      isSecp256k1Blake160MultisigScript(lockScript, config))
  ) {
    return secp256k1Blake160Multisig.injectCapacity(
      txSkeleton,
      outputIndex,
      fromInfo,
      { config }
    );
  } else {
    throw new Error("Output lock script not supported!");
  }
}

async function setupInputCell(
  txSkeleton,
  inputIndex,
  fromInfo,
  { config = undefined } = {}
) {
  config = config || getConfig();
  if (inputIndex >= txSkeleton.get("inputs").size) {
    throw new Error("Invalid input index!");
  }

  const input = txSkeleton.get("inputs").get(inputIndex);
  const lockScript = input.cell_output.lock;
  if (isSecp256k1Blake160Script(lockScript, config)) {
    return secp256k1Blake160.setupInputCell(txSkeleton, inputIndex, { config });
  } else if (isSecp256k1Blake160MultisigScript(lockScript, config)) {
    return secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      inputIndex,
      fromInfo,
      { config }
    );
  } else {
    throw new Error("Unsupported lock script!");
  }
}

module.exports = {
  transfer,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  __tests__: {
    _commonTransfer,
  },
};
