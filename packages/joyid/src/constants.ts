// https://github.com/duanyytop/joyid-sdk-js/blob/4629f5158a5f54f00d765832d2d78fb20bb7c64b/src/constants/index.ts
import { CellDep, Script } from "@ckb-lumos/base";

const TestnetInfo = {
  JoyIDLockScript: {
    codeHash:
      "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
    hashType: "type",
    args: "",
  } as Script,

  JoyIDLockDep: {
    outPoint: {
      txHash:
        "0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  CotaTypeScript: {
    codeHash:
      "0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8",
    hashType: "type",
    args: "0x",
  } as Script,

  CotaTypeDep: {
    outPoint: {
      txHash:
        "0x636a786001f87cb615acfcf408be0f9a1f077001f0bbc75ca54eadfe7e221713",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,
};

const MainnetInfo = {
  JoyIDLockScript: {
    codeHash:
      "0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323",
    hashType: "type",
    args: "",
  } as Script,

  JoyIDLockDep: {
    outPoint: {
      txHash:
        "0xf05188e5f3a6767fc4687faf45ba5f1a6e25d3ada6129dae8722cb282f262493",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,

  CotaTypeScript: {
    codeHash:
      "0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df",
    hashType: "type",
    args: "0x",
  } as Script,

  CotaTypeDep: {
    outPoint: {
      txHash:
        "0xabaa25237554f0d6c586dc010e7e85e6870bcfd9fb8773257ecacfbe1fd738a0",
      index: "0x0",
    },
    depType: "depGroup",
  } as CellDep,
};

export const getJoyIDLockScript = (isMainnet = false): Script =>
  isMainnet ? MainnetInfo.JoyIDLockScript : TestnetInfo.JoyIDLockScript;

export const getJoyIDCellDep = (isMainnet = false): CellDep =>
  isMainnet ? MainnetInfo.JoyIDLockDep : TestnetInfo.JoyIDLockDep;

export const getCotaTypeScript = (isMainnet = false): Script =>
  isMainnet ? MainnetInfo.CotaTypeScript : TestnetInfo.CotaTypeScript;

export const getCotaCellDep = (isMainnet = false): CellDep =>
  isMainnet ? MainnetInfo.CotaTypeDep : TestnetInfo.CotaTypeDep;
