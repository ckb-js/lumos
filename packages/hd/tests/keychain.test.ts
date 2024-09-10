import test from "ava";
import { Keychain } from "../src";
import { bytes } from "@ckb-lumos/codec";

const { bytify, hexify } = bytes;

// https://en.bitcoin.it/wiki/BIP_0032_TestVectors
const shortSeed = bytify("0x000102030405060708090a0b0c0d0e0f");
const longSeed = bytify(
  "0xfffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542"
);

test("create master keychain from seed", (t) => {
  const master = Keychain.fromSeed(shortSeed);

  t.is(
    hexify(master.privateKey),
    "0xe8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35"
  );
  t.is(hexify(master.identifier), "0x3442193e1bb70916e914552172cd4e2dbc9df811");
  t.is(master.fingerprint, 876747070);
  t.is(
    hexify(master.chainCode),
    "0x873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508"
  );
  t.is(master.index, 0);
  t.is(master.depth, 0);
  t.is(master.parentFingerprint, 0);
});

test("derive children hardened", (t) => {
  const master = Keychain.fromSeed(shortSeed);
  const child = master.deriveChild(0, true);

  t.is(
    hexify(child.privateKey),
    "0xedb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea"
  );
  t.is(hexify(child.identifier), "0x5c1bd648ed23aa5fd50ba52b2457c11e9e80a6a7");
  t.is(child.fingerprint, 1545328200);
  t.is(
    hexify(child.chainCode),
    "0x47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141"
  );
  t.is(child.index, 0);
  t.is(child.depth, 1);
});

test("derive path", (t) => {
  const master = Keychain.fromSeed(shortSeed);
  t.is(
    hexify(master.derivePath(`m/0'`).privateKey),
    "0xedb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea"
  );

  const child = master.derivePath(`m/0'/1/2'`);

  t.is(
    hexify(child.privateKey),
    "0xcbce0d719ecf7431d88e6a89fa1483e02e35092af60c042b1df2ff59fa424dca"
  );
  t.is(hexify(child.identifier), "0xee7ab90cde56a8c0e2bb086ac49748b8db9dce72");
  t.is(child.fingerprint, 4001020172);
  t.is(
    hexify(child.chainCode),
    "0x04466b9cc8e161e966409ca52986c584f07e9dc81f735db683c3ff6ec7b1503f"
  );
  t.is(child.index, 2);
  t.is(child.depth, 3);
});

test("create master keychain from long seed", (t) => {
  const master = Keychain.fromSeed(longSeed);

  t.is(
    hexify(master.privateKey),
    "0x4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e"
  );
  t.is(hexify(master.identifier), "0xbd16bee53961a47d6ad888e29545434a89bdfe95");
  t.is(master.fingerprint, 3172384485);
  t.is(
    hexify(master.chainCode),
    "0x60499f801b896d83179a4374aeb7822aaeaceaa0db1f85ee3e904c4defbd9689"
  );
  t.is(master.index, 0);
  t.is(master.depth, 0);
  t.is(master.parentFingerprint, 0);
});

test("derive path large index", (t) => {
  const master = Keychain.fromSeed(longSeed);
  t.is(
    hexify(master.derivePath(`m`).privateKey),
    "0x4b03d6fc340455b363f51020ad3ecca4f0850280cf436c70c727923f6db46c3e"
  );

  let child = master.derivePath(`0/2147483647'`);
  t.is(
    hexify(child.privateKey),
    "0x877c779ad9687164e9c2f4f0f4ff0340814392330693ce95a58fe18fd52e6e93"
  );
  t.is(hexify(child.identifier), "0xd8ab493736da02f11ed682f88339e720fb0379d1");
  t.is(child.fingerprint, 3635104055);
  t.is(
    hexify(child.chainCode),
    "0xbe17a268474a6bb9c61e1d720cf6215e2a88c5406c4aee7b38547f585c9a37d9"
  );
  t.is(child.index, 2147483647);
  t.is(child.depth, 2);

  child = child.deriveChild(1, false);
  t.is(
    hexify(child.privateKey),
    "0x704addf544a06e5ee4bea37098463c23613da32020d604506da8c0518e1da4b7"
  );
  t.is(hexify(child.identifier), "0x78412e3a2296a40de124307b6485bd19833e2e34");
  t.is(child.fingerprint, 2017537594);
  t.is(
    hexify(child.chainCode),
    "0xf366f48f1ea9f2d1d3fe958c95ca84ea18e4c4ddb9366c336c927eb246fb38cb"
  );
  t.is(child.index, 1);
  t.is(child.depth, 3);

  child = child.deriveChild(2147483646, true);
  t.is(
    hexify(child.privateKey),
    "0xf1c7c871a54a804afe328b4c83a1c33b8e5ff48f5087273f04efa83b247d6a2d"
  );
  t.is(hexify(child.identifier), "0x31a507b815593dfc51ffc7245ae7e5aee304246e");
  t.is(child.fingerprint, 832899000);
  t.is(
    hexify(child.chainCode),
    "0x637807030d55d01f9a0cb3a7839515d796bd07706386a6eddf06cc29a65a0e29"
  );
  t.is(child.index, 2147483646);
  t.is(child.depth, 4);
});

test("derive children no hardened", (t) => {
  const master = Keychain.fromSeed(longSeed);
  const child = master.deriveChild(0, false);
  t.is(
    hexify(child.privateKey),
    "0xabe74a98f6c7eabee0428f53798f0ab8aa1bd37873999041703c742f15ac7e1e"
  );
  t.is(hexify(child.identifier), "0x5a61ff8eb7aaca3010db97ebda76121610b78096");
  t.is(child.fingerprint, 1516371854);
  t.is(
    hexify(child.chainCode),
    "0xf0909affaa7ee7abe5dd4e100598d4dc53cd709d5a5c2cac40e7412f232f7c9c"
  );
  t.is(child.index, 0);
  t.is(child.depth, 1);
});

test("create child keychain from public key", (t) => {
  const child = Keychain.fromPublicKey(
    bytify(
      "0x0357bfe1e341d01c69fe5654309956cbea516822fba8a601743a012a7896ee8dc2"
    ),
    bytify(
      "0x04466b9cc8e161e966409ca52986c584f07e9dc81f735db683c3ff6ec7b1503f"
    ),
    `m/0'/1/2'`
  );
  t.is(hexify(child.identifier), "0xee7ab90cde56a8c0e2bb086ac49748b8db9dce72");
  t.is(child.fingerprint, 4001020172);
  t.is(child.index, 2);
  t.is(child.depth, 3);

  const grandchild = child.deriveChild(2, false);
  t.is(
    hexify(grandchild.publicKey),
    "0x02e8445082a72f29b75ca48748a914df60622a609cacfce8ed0e35804560741d29"
  );
  t.is(
    hexify(grandchild.chainCode),
    "0xcfb71883f01676f587d023cc53a35bc7f88f724b1f8c2892ac1275ac822a3edd"
  );
  t.is(
    hexify(grandchild.identifier),
    "0xd880d7d893848509a62d8fb74e32148dac68412f"
  );
  t.is(grandchild.fingerprint, 3632322520);
  t.is(grandchild.index, 2);
  t.is(grandchild.depth, 4);
});

test("derive ckb keys", (t) => {
  const master = Keychain.fromSeed(shortSeed);
  const extendedKey = master.derivePath(`m/44'/309'/0'`);
  t.is(
    hexify(extendedKey.privateKey),
    "0xbb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016"
  );
  t.is(
    hexify(extendedKey.publicKey),
    "0x03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3"
  );
  t.is(
    hexify(extendedKey.chainCode),
    "0x37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8"
  );

  const addressKey = extendedKey.deriveChild(0, false).deriveChild(0, false);
  t.is(
    hexify(addressKey.privateKey),
    "0xfcba4708f1f07ddc00fc77422d7a70c72b3456f5fef3b2f68368cdee4e6fb498"
  );
  t.is(
    hexify(addressKey.publicKey),
    "0x0331b3c0225388c5010e3507beb28ecf409c022ef6f358f02b139cbae082f5a2a3"
  );
  t.is(
    hexify(addressKey.chainCode),
    "0xc4b7aef857b625bbb0497267ed51151d090f81737f4f22a0ac3673483b927090"
  );
});

test("derive ckb keys another seed", (t) => {
  const master = Keychain.fromSeed(
    // From mnemonic `tank planet champion pottery together intact quick police asset flower sudden question`
    bytify(
      "0x1371018cfad5990f5e451bf586d59c3820a8671162d8700533549b0df61a63330e5cd5099a5d3938f833d51e4572104868bfac7cfe5b4063b1509a995652bc08"
    )
  );
  t.is(
    hexify(master.privateKey),
    "0x37d25afe073a6ba17badc2df8e91fc0de59ed88bcad6b9a0c2210f325fafca61"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'`).privateKey),
    "0x2925f5dfcbee3b6ad29100a37ed36cbe92d51069779cc96164182c779c5dc20e"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).privateKey),
    "0x047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'/0`).privateKey),
    "0x047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1"
  );

  t.is(
    hexify(
      master
        .derivePath(`m/44'/309'/0'`)
        .deriveChild(0, false)
        .deriveChild(0, false).privateKey
    ),
    "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'/0/0`).privateKey),
    "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14"
  );
});

test("derive ckb keys from master extended key", (t) => {
  const privateKey = bytify(
    "0x37d25afe073a6ba17badc2df8e91fc0de59ed88bcad6b9a0c2210f325fafca61"
  );
  const chainCode = bytify(
    "0x5f772d1e3cfee5821911aefa5e8f79d20d4cf6678378d744efd08b66b2633b80"
  );
  const master = new Keychain(privateKey, chainCode);
  t.is(
    hexify(master.publicKey),
    "0x020720a7a11a9ac4f0330e2b9537f594388ea4f1cd660301f40b5a70e0bc231065"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'`).privateKey),
    "0x2925f5dfcbee3b6ad29100a37ed36cbe92d51069779cc96164182c779c5dc20e"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'`).deriveChild(0, false).privateKey),
    "0x047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'/0`).privateKey),
    "0x047fae4f38b3204f93a6b39d6dbcfbf5901f2b09f6afec21cbef6033d01801f1"
  );

  t.is(
    hexify(
      master
        .derivePath(`m/44'/309'/0'`)
        .deriveChild(0, false)
        .deriveChild(0, false).privateKey
    ),
    "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14"
  );

  t.is(
    hexify(master.derivePath(`m/44'/309'/0'/0/0`).privateKey),
    "0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14"
  );
});

test("private key add", (t) => {
  const privateKey = bytify(
    "0x9e919c96ac5a4caea7ba0ea1f7dd7bca5dca8a11e66ed633690c71e483a6e3c9"
  );
  const toAdd = bytify(
    "0x36e92e33659808bf06c3e4302b657f39ca285f6bb5393019bb4e2f7b96e3f914"
  );
  // @ts-ignore: Private method
  const sum = Keychain.privateKeyAdd(privateKey, toAdd);
  t.is(
    hexify(sum),
    "0xd57acaca11f2556dae7df2d22342fb0427f2e97d9ba8064d245aa1601a8adcdd"
  );
});

test("public key add", (t) => {
  const publicKey = bytify(
    "0x03556b2c7e03b12845a973a6555b49fe44b0836fbf3587709fa73bb040ba181b21"
  );
  const toAdd = bytify(
    "0x953fd6b91b51605d32a28ab478f39ab53c90103b93bd688330b118c460e9c667"
  );
  // @ts-ignore: Private method
  const sum = Keychain.publicKeyAdd(publicKey, toAdd);
  t.is(
    hexify(sum),
    "0x03db6eab66f918e434bae0e24fd73de1a2b293a2af9bd3ad53123996fa94494f37"
  );
});
