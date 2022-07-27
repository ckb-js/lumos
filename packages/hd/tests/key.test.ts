import test from "ava";
import { key } from "../src";
const { signRecoverable, recoverFromSignature, privateToPublic, publicKeyToBlake160, privateKeyToBlake160 } = key;

const signInfo = {
  message: "0x95e919c41e1ae7593730097e9bb1185787b046ae9f47b4a10ff4e22f9c3e3eab",
  signature:
    "0x1e94db61cff452639cf7dd991cf0c856923dcf74af24b6f575b91479ad2c8ef40769812d1cf1fd1a15d2f6cb9ef3d91260ef27e65e1f9be399887e9a5447786301",
  privateKey: "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3",
  publicKey: "0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01",
  blake160: "0x36c329ed630d6ce750712a477543672adab57f4c",
};

test("signRecoverable", (t) => {
  const signature = signRecoverable(signInfo.message, signInfo.privateKey);
  t.is(signature, signInfo.signature);
});

test("recoverFromMessage", (t) => {
  const publicKey = recoverFromSignature(signInfo.message, signInfo.signature);
  t.is(publicKey, signInfo.publicKey);
});

test("privateToPublic, derive public key from private key, Buffer", (t) => {
  const privateKey = Buffer.from("bb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016", "hex");
  const publicKey = Buffer.from("03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3", "hex");
  t.deepEqual(privateToPublic(privateKey), publicKey);
});

test("privateToPublic, derive public key from private key, HexString", (t) => {
  const privateKey = "0xbb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016";
  const publicKey = "0x03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3";
  t.deepEqual(privateToPublic(privateKey), publicKey);
});

test("privateToPublic, derive public key from private key wrong length", (t) => {
  t.throws(() => {
    privateToPublic(Buffer.from(""));
  });
  t.throws(() => {
    privateToPublic(Buffer.from("39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016", "hex"));
  });
  t.throws(() => {
    privateToPublic(Buffer.from("0xbb39d218506b30ca69b0f3112427877d983dd3cd2cabc742ab723e2964d98016", "hex"));
  });
});

test("publicKeyToBlake160", (t) => {
  const blake160 = publicKeyToBlake160(signInfo.publicKey);
  t.is(blake160, signInfo.blake160);
});

test("privateKeyToBlake160", (t) => {
  const blake160 = privateKeyToBlake160(signInfo.privateKey);
  t.is(blake160, signInfo.blake160);
});
