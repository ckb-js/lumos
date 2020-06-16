function addCellDep(txSkeleton, newCellDep) {
  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type === newCellDep.dep_type &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(newCellDep.out_point, { validate: false })
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: newCellDep.out_point,
        dep_type: newCellDep.dep_type,
      });
    });
  }

  return txSkeleton;
}

function generateDaoScript(config) {
  const template = config.SCRIPTS.DAO.SCRIPT;

  return {
    code_hash: template.code_hash,
    hash_type: template.hash_type,
    args: "0x",
  };
}

function isSecp256k1Blake160Script(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160.SCRIPT;
  return (
    script.code_hash === template.code_hash &&
    script.hash_type === template.hash_type
  );
}

function isSecp256k1Blake160MultisigScript(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT;
  return (
    script.code_hash === template.code_hash &&
    script.hash_type === template.hash_type
  );
}

function isDaoScript(script, config) {
  const template = config.SCRIPTS.DAO.SCRIPT;

  return (
    script &&
    script.code_hash === template.code_hash &&
    script.hash_type === template.hash_type
  );
}

module.exports = {
  addCellDep,
  generateDaoScript,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  isDaoScript,
};
