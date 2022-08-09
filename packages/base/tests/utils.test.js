const test = require("ava");

const {
  CKBHasher,
  ckbHash,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
  generateTypeIdScript,
  deepCamel,
  deepCamelizeTransaction,
} = require("../src/utils");

const message = "0x";
const messageDigest =
  "0x44f4c69744d5f8c55d642062949dcae49bc4e7ef43d388c5a12f42b5633d163e";

test.before(() => {
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("CKBHasher, hex", (t) => {
  const result = new CKBHasher().update(message).digestHex();
  t.is(result, messageDigest);
});

test("CKBHasher, reader", (t) => {
  const result = new CKBHasher().update(message).digestHex();
  t.is(result, messageDigest);
});

test("ckbHash", (t) => {
  const result = ckbHash(message);
  t.is(result, messageDigest);
});

const script = {
  codeHash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hashType: "type",
  args: "0x36c329ed630d6ce750712a477543672adab57f4c",
};
const scriptHash =
  "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d";

test("computeScriptHash", (t) => {
  t.is(computeScriptHash(script), scriptHash);
});

test("hashCode, should return same hash if same input", (t) => {
  const buffer = Buffer.from("1234ab", "hex");
  t.is(hashCode(buffer), hashCode(buffer));
});

test("assertHexString", (t) => {
  t.notThrows(() => assertHexString("", "0x"));
  t.notThrows(() => assertHexString("", "0x1234"));
  t.throws(() => assertHexString("", "1234"));
  t.throws(() => assertHexString("", "0x123"));
  t.throws(() => assertHexString("", "0x123h"));
});

test("assertHexadecimal", (t) => {
  t.notThrows(() => assertHexadecimal("", "0x0"));
  t.notThrows(() => assertHexadecimal("", "0x01"));
  t.notThrows(() => assertHexadecimal("", "0x12"));
  t.throws(() => assertHexadecimal("", "12"));
  t.throws(() => assertHexadecimal("", "1r"));
});

test("test type id", (t) => {
  const input = {
    previousOutput: {
      index: "0x0",
      txHash:
        "0x128b201cd1995efba3126d4431f837c34f7d2f6a29ed8968d2ebc39059add56a",
    },
    since: "0x0",
  };
  const typeIdScript = {
    args: "0xa803c9ed6c190fd780e64d885794933ab23da641e94ad1b9270ebac893a7cdcc",
    codeHash:
      "0x00000000000000000000000000000000000000000000000000545950455f4944",
    hashType: "type",
  };
  t.deepEqual(generateTypeIdScript(input, "0x0"), typeIdScript);
});

test("test camalize", (t) => {
  const sampleInput = {
    dep_type: "dep_group",
    script: {
      code_hash: "code_hash",
      hash_type: "hash_type",
      args: "args",
    },
  };
  const expectedOutput1 = {
    depType: "dep_group",
    script: {
      codeHash: "code_hash",
      hashType: "hash_type",
      args: "args",
    },
  };
  const expectedOutput2 = {
    depType: "depGroup",
    script: {
      codeHash: "code_hash",
      hashType: "hash_type",
      args: "args",
    },
  };
  t.deepEqual(deepCamel(sampleInput), expectedOutput1);
  t.deepEqual(deepCamelizeTransaction(sampleInput), expectedOutput2);
});
