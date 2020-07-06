import { Address, Script } from "@ckb-lumos/base";

interface AddressInfo {
  testnetAddress: Address;
  mainnetAddress: Address;
  script: Script;
}

export const shortAddressInfo: AddressInfo = {
  testnetAddress: "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83",
  mainnetAddress: "ckb1qyqrdsefa43s6m882pcj53m4gdnj4k440axqdt9rtd",
  script: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0x36c329ed630d6ce750712a477543672adab57f4c",
  },
};

export const multisigAddressInfo: AddressInfo = {
  mainnetAddress: "ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg",
  testnetAddress: "ckt1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqt6f5y5",
  script: {
    code_hash:
      "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    hash_type: "type",
    args: "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a",
  },
};

export const fullAddressInfo: AddressInfo = {
  mainnetAddress:
    "ckb1qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpvumhs9nvu786dj9p0q5elx66t24n3kxgmz0sxt",
  testnetAddress:
    "ckt1qsqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpvumhs9nvu786dj9p0q5elx66t24n3kxgkpkap5",
  script: {
    code_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hash_type: "type",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  },
};

export const fullAddressInfoWithData: AddressInfo = {
  mainnetAddress:
    "ckb1q2da0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsdkr98kkxrtvuag8z2j8w4pkw2k6k4l5c7jxc4f",
  testnetAddress:
    "ckt1q2da0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsdkr98kkxrtvuag8z2j8w4pkw2k6k4l5cn3l4jk",
  script: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data",
    args: "0x36c329ed630d6ce750712a477543672adab57f4c",
  },
};
