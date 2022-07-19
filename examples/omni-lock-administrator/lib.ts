import { HexString } from "@ckb-lumos/base";
import { Reader } from "@ckb-lumos/toolkit";
import { H256, Hasher, SparseMerkleTree } from "sparse-merkle-tree-ts";
import * as util from "@nervosnetwork/ckb-sdk-utils";
import { Blake2b } from "@nervosnetwork/ckb-sdk-utils/lib/crypto/blake2b";
import { SerializeRCData } from "./generated/omni";
export { H256 };

export const SMT_EXISTING: H256 = new H256([
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]);

export const SMT_NOT_EXISTING: H256 = new H256([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]);

export const WHITE_BLACK_LIST_MASK = 0x2;
// on(1): emergency halt mode
// off(0): not int emergency halt mode
export const EMERGENCY_HALT_MODE_MASK = 0x1;

export enum ProofMask {
  OnlyInput = "0x01",
  OnlyOutput = "0x02",
  BothOn = "0x03",
}

export enum ProofScheme {
  OnWhiteList,
  NotOnWhiteList,
  OnBlackList,
  NotOnBlackList,
  EmergencyHaltMode,
}

class Blake2bHasher extends Hasher {
  hasher: Blake2b;

  constructor() {
    super();

    this.hasher = util.blake2b(32, null, null, new TextEncoder().encode("ckb-default-hash"));
  }

  update(h: H256): this {
    this.hasher.update(h);

    return this;
  }

  final(): H256 {
    return new H256(this.hasher.final("binary") as Uint8Array);
  }
}

const newSMT = (items: [H256, H256][]) => {
  const tree = new SparseMerkleTree(() => new Blake2bHasher());

  items.map((item) => {
    tree.update(item[0], item[1]);
  });

  return tree;
};

export const buildSmtOnWl = (hashes: H256[], on: boolean = true): { root: H256; proof: H256 } => {  
  const existingPairs: [H256, H256][] = hashes.map((hash) => [hash, SMT_EXISTING]);

  // this is the hash on white list, and "hashes" are on that.
  const keyOnWl1 = new H256([
    111,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);

  const keyOnWl2: H256 = new H256([
    222,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);

  let pairs: [H256, H256][] = [
    [keyOnWl1, SMT_EXISTING],
    [keyOnWl2, SMT_EXISTING],
  ];

  if (on) {
    pairs = [...pairs, ...existingPairs];
  }

  const smt = newSMT(pairs);
  const root = smt.root;

  const proof = smt.merkle_proof(existingPairs.map((p) => p[0]));
  const compiledProof = proof.compile(existingPairs);

  return { root, proof: new H256(compiledProof) };
};

export const buildSmtOnBl = (hashes: H256[], on: boolean = true): { root: H256; proof: H256 } => {
  const testPairs: [H256, H256][] = hashes.map((hash) => [hash, SMT_NOT_EXISTING]);

  // this is the hash on black list, but "hashes" are not on that.
  const keyOnBl1: H256 = new H256([
    111,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);

  const keyOnBl2: H256 = new H256([
    222,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);

  let pairs: [H256, H256][] = [
    [keyOnBl1, SMT_EXISTING],
    [keyOnBl2, SMT_EXISTING],
  ];

  const smt = newSMT(pairs);
  const root = smt.root;

  const proof = smt.merkle_proof(testPairs.map((p) => p[0]));
  const compiledProof = proof.compile(testPairs);

  if (on) {
    root.get_bit(0) ? root.clear_bit(0) : root.set_bit(0);
    return { root, proof: new H256(compiledProof) };
  }

  return { root, proof: new H256(compiledProof) };
};

export const buildRcRule = (smtRoot: H256, config: { isBlack?: boolean; isEmergency?: boolean } = {}) => {
  const flag = (() => {
    if (!config.isBlack) {
      return WHITE_BLACK_LIST_MASK;
    }

    if (config.isEmergency) {
      return EMERGENCY_HALT_MODE_MASK;
    }

    return 0;
  })();

  const data = SerializeRCData({
    type: "RCRule",
    value: {
      smt_root: new Reader(smtRoot).toArrayBuffer(),
      flags: flag,
    },
  });

  return new H256(data);
};

export const buildRcVec = (RCEcellHashs: Array<HexString>) => {
  const data = SerializeRCData({
    type: "RCCellVec",
    value: RCEcellHashs.map(cellHash => new Reader(cellHash).toArrayBuffer()),
  });

  return new H256(data);
};

export const generateSingleProof = (scheme: ProofScheme, hashes: H256[]): {
  proof: H256,
  rcData: H256,
} => {
  const { isBlackList, isEmergencyHalt, smtRoot, proof } = (() => {
    const isBlackList = false;
    const isEmergencyHalt = false;

    if (scheme === ProofScheme.OnWhiteList) {
      const res = buildSmtOnWl(hashes);
      return {
        isBlackList,
        isEmergencyHalt,
        smtRoot: res.root,
        proof: res.proof,
      };
    }

    if (scheme === ProofScheme.NotOnWhiteList) {
      const res = buildSmtOnWl(hashes, false);
      return {
        isBlackList,
        isEmergencyHalt,
        smtRoot: res.root,
        proof: res.proof,
      };
    }

    if (scheme === ProofScheme.OnBlackList) {
      const res = buildSmtOnBl(hashes);
      return {
        isBlackList: true,
        isEmergencyHalt,
        smtRoot: res.root,
        proof: res.proof,
      };
    }

    if (scheme === ProofScheme.NotOnBlackList) {
      const res = buildSmtOnBl(hashes, false);
      return {
        isBlackList: true,
        isEmergencyHalt,
        smtRoot: res.root,
        proof: res.proof,
      };
    }

    if (scheme === ProofScheme.EmergencyHaltMode) {
      return {
        isBlackList,
        isEmergencyHalt: true,
        smtRoot: H256.zero(),
        proof: H256.zero(),
      };
    }

    return {
      isBlackList,
      isEmergencyHalt,
      smtRoot: H256.zero(),
      proof: H256.zero(),
    };
  })();

  return {
    proof, 
    rcData: buildRcRule(smtRoot, { isBlack: isBlackList, isEmergency: isEmergencyHalt })
  };
};

export const h256ToHex = (h256: H256): HexString => {
  return new Reader(h256).serializeJson();
};

export const hexToH256 = (hex: HexString): H256 => {
  return new H256(new Reader(hex).toArrayBuffer());
};
