import test from "ava";
import { ExtendedPrivateKey, Keystore, IncorrectPassword } from "../src";

const fixture = {
  privateKey:
    "0xe8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35",
  publicKey:
    "0x0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2",
  chainCode:
    "0x873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508",
};

// 'load and check password'
const password = "hello~!23";
const keystore = Keystore.create(
  new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode),
  password
);

test("checks wrong password", (t) => {
  t.false(keystore.checkPassword(`oops${password}`));
});

test("checks correct password", (t) => {
  t.true(keystore.checkPassword(password));
});

test("store key", (t) => {
  keystore.save("./tests/");
  const loaded = Keystore.load(`./tests/${keystore.id}.json`);
  t.is(loaded.id, keystore.id);
});

test("decrypts", (t) => {
  t.is(
    keystore.decrypt(password),
    new ExtendedPrivateKey(fixture.privateKey, fixture.chainCode).serialize()
  );
});

test("load and check password, loads private key", (t) => {
  const extendedPrivateKey = keystore.extendedPrivateKey(password);
  t.is(extendedPrivateKey.privateKey, fixture.privateKey);
  t.is(extendedPrivateKey.chainCode, fixture.chainCode);
});

/**
 * test vector:
 * https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition#test-vectors
 * Address: 008aeeda4d805471df9b2a5b0f38a0c3bcba786b
 * ICAP: XE542A5PZHH8PYIZUBEJEO0MFWRAPPIL67
 * UUID: 3198bc9c-6672-5ab3-d9954942343ae5b6
 * Password: testpassword
 * Scrypt: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition#scrypt
 * Secret: 7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d
 * Derived key: fac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd
 * MAC Body bb5cc24229e20d8766fd298291bba6bdd172bf743a674da9cdad04534d56926ef8358534d458fffccd4e6ad2fbde479c
 * MAC: 2103ac29920d71da29f15d75b4a16dbe95cfd7ff8faea1056c33131d846e3097
 * Cipher key: fac192ceb5fd772906bea3e118a69e8b
 */
test("load test vector keystore", (t) => {
  const json = {
    crypto: {
      cipher: "aes-128-ctr",
      cipherparams: {
        iv: "83dbcc02d8ccb40e466191a123791e0e",
      },
      ciphertext:
        "d172bf743a674da9cdad04534d56926ef8358534d458fffccd4e6ad2fbde479c",
      kdf: "scrypt",
      kdfparams: {
        dklen: 32,
        n: 262144,
        p: 8,
        r: 1,
        salt: "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
      },
      mac: "2103ac29920d71da29f15d75b4a16dbe95cfd7ff8faea1056c33131d846e3097",
    },
    id: "3198bc9c-6672-5ab3-d995-4942343ae5b6",
    version: 3,
  };
  const keystore = Keystore.fromJson(JSON.stringify(json));
  t.true(keystore.checkPassword("testpassword"));
  t.deepEqual(
    keystore.decrypt("testpassword"),
    "0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d"
  );
  t.deepEqual(
    keystore.derivedKey("testpassword").toString("hex"),
    "fac192ceb5fd772906bea3e118a69e8bbb5cc24229e20d8766fd298291bba6bd"
  );
});

// 'load ckb cli light keystore'
test("load ckb cli light keystore, checks correct password", (t) => {
  const password = "123";
  const keystoreString =
    '{"crypto":{"cipher": "aes-128-ctr", "ciphertext": "253397209cae86474e368720f9baa30f448767047d2cc5a7672ef121861974ed", "cipherparams": {"iv": "8bd8523e0048db3a4ae2534aec6d303a"}, "kdf": "scrypt", "kdfparams": {"dklen": 32, "n": 4096, "p": 6, "r": 8, "salt": "be3d86c99f4895f99d1a0048afb61a34153fa83d5edd033fc914de2c502f57e7"}, "mac": "4453cf5d4f6ec43d0664c3895c4ab9b1c9bcd2d02c7abb190c84375a42739099" },"id": "id", "version": 3}';
  const keystore = Keystore.fromJson(keystoreString);
  t.true(keystore.checkPassword(password));
});

// 'load ckb cli standard keystore'
test("load ckb cli standard keystore, checks correct password", (t) => {
  const password = "123";
  const keystoreString =
    '{"address":"ea22142fa5be326e834681144ca30326f99a6d5a","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"29304e5bcbb1885ef5cdcb40b5312b58"},"ciphertext":"93054530a8fbe5b11995acda856585d7362ac7d2b1e4f268c633d997be2d6532c4962501d0835bf52a4693ae7a091ac9bac9297793f4116ef7c123edb00dbc85","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"724327e67ca321ccf15035bb78a0a05c816bebbe218a0840abdc26da8453c1f4"},"mac":"1d0e5660ffbfc1f9ff4da97aefcfc2153c0ec1b411e35ffee26ee92815cc06f9"},"id":"43c1116e-efd5-4c9e-a86a-3ec0ab163122","version":3}';
  const keystore = Keystore.fromJson(keystoreString);
  t.true(keystore.checkPassword(password));
});

test("load ckb cli standard keystore, loads private key", (t) => {
  const password = "123";
  const keystoreString =
    '{"address":"ea22142fa5be326e834681144ca30326f99a6d5a","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"29304e5bcbb1885ef5cdcb40b5312b58"},"ciphertext":"93054530a8fbe5b11995acda856585d7362ac7d2b1e4f268c633d997be2d6532c4962501d0835bf52a4693ae7a091ac9bac9297793f4116ef7c123edb00dbc85","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"724327e67ca321ccf15035bb78a0a05c816bebbe218a0840abdc26da8453c1f4"},"mac":"1d0e5660ffbfc1f9ff4da97aefcfc2153c0ec1b411e35ffee26ee92815cc06f9"},"id":"43c1116e-efd5-4c9e-a86a-3ec0ab163122","version":3}';
  const keystore = Keystore.fromJson(keystoreString);
  const extendedPrivateKey = keystore.extendedPrivateKey(password);
  t.is(
    extendedPrivateKey.privateKey,
    "0x8af124598932440269a81771ad662642e83a38b323b2f70223b8ae0b6c5e0779"
  );
  t.is(
    extendedPrivateKey.chainCode,
    "0x615302e2c93151a55c29121dd02ad554e47908a6df6d7374f357092cec11675b"
  );
});

test("load ckb cli origin keystore", (t) => {
  const keystoreString =
    '{"origin":"ckb-cli", "address":"ea22142fa5be326e834681144ca30326f99a6d5a","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"29304e5bcbb1885ef5cdcb40b5312b58"},"ciphertext":"93054530a8fbe5b11995acda856585d7362ac7d2b1e4f268c633d997be2d6532c4962501d0835bf52a4693ae7a091ac9bac9297793f4116ef7c123edb00dbc85","kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"724327e67ca321ccf15035bb78a0a05c816bebbe218a0840abdc26da8453c1f4"},"mac":"1d0e5660ffbfc1f9ff4da97aefcfc2153c0ec1b411e35ffee26ee92815cc06f9"},"id":"43c1116e-efd5-4c9e-a86a-3ec0ab163122","version":3}';
  const keystore = Keystore.fromJson(keystoreString);
  t.is(keystore.origin, "ckb-cli");
});

// "create empty keystore"
const emptyKeystore = Keystore.createEmpty();

test("empty keystore has empty cipertext and mac", (t) => {
  t.is(emptyKeystore.crypto.ciphertext, "");
  t.is(emptyKeystore.crypto.mac, "");
});

test("empty keystore won't verify password", (t) => {
  t.false(emptyKeystore.checkPassword(""));
  t.false(emptyKeystore.checkPassword("anypassword"));
});

test("empty keystore cannot decrypt", (t) => {
  const err = t.throws(() => emptyKeystore.decrypt(""));
  t.true(err instanceof IncorrectPassword);
});
