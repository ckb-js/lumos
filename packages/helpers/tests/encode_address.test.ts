import test from "ava";
import { encodeToAddress } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
import { Script } from "@ckb-lumos/base";

const AGGRON = predefined.AGGRON4;

test("encode to full address", (t) => {
  const script: Script = {
    args: "0x159890a7cacb44a95bef0743064433d763de229c",
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
  };
  const mainnetAddress = encodeToAddress(script);
  const testnetAddress = encodeToAddress(script, { config: AGGRON });

  t.is(
    mainnetAddress,
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqg4nzg20jktgj54hmc8gvrygv7hv00z98qcdnk0k"
  );
  t.is(
    testnetAddress,
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqg4nzg20jktgj54hmc8gvrygv7hv00z98qklce9w"
  );
});

test("encode to full address, data1", (t) => {
  const script: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data1",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  };
  const testnetAddress = encodeToAddress(script, { config: AGGRON });
  t.is(
    testnetAddress,
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqkkxdwn"
  );
});
