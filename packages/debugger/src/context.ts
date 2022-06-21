import { Header, OutPoint } from "@ckb-lumos/base";
import * as crypto from "crypto";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { loadCode, LoadedCode } from "./loader";
import { DataLoader, TestContext } from "./types";
import { OutPointValue } from "@ckb-lumos/base/lib/values";
import { CKBDebuggerDownloader } from "./download";
import { CKBDebugger } from "./executor";
import * as fs from "fs";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { Uint32 } from "@ckb-lumos/codec/lib/number";

export function mockOutPoint(): OutPoint {
  return {
    tx_hash: hexify(crypto.randomBytes(32)),
    index: "0x" + Uint32.unpack(crypto.randomBytes(4)).toString(16),
  };
}

// TODO implement dep_group
type LocaleConfig = { path: string } /*| { group: string[] }*/;
export type LocaleCode = { [key: string]: LocaleConfig };

export type CreateContextOptions = {
  codeLocale: LocaleCode;
};

function createCKBDebugger(loader: DataLoader): CKBDebugger {
  if (process.env.CKB_DEBUGGER_PATH) {
    if (!fs.existsSync(process.env.CKB_DEBUGGER_PATH)) {
      throw new Error(
        `Cannot find ckb-debugger in CKB_DEBUGGER_PATH of ${process.env.CKB_DEBUGGER_PATH}`
      );
    }

    return new CKBDebugger({
      debuggerPath: process.env.CKB_DEBUGGER_PATH,
      loader,
    });
  }

  const downloader = new CKBDebuggerDownloader();
  const defaultDebuggerPath = downloader.getDebuggerPath();

  return new CKBDebugger({
    debuggerPath: defaultDebuggerPath,
    loader,
  });
}

// TODO support load dep_group
export function createTestContext<Code extends LocaleCode>(config: {
  deps: Code;
}): TestContext<Code> {
  const { deps } = config;

  const loadedCodes: Record<keyof Code, LoadedCode> = Object.entries(
    deps
  ).reduce(
    (scriptConfigs, [key, configItem]) =>
      Object.assign(scriptConfigs, { [key]: loadCode(configItem.path) }),
    {} as Record<keyof Code, LoadedCode>
  );

  const scriptConfigs: Record<keyof Code, ScriptConfig> = Object.entries(
    loadedCodes
  ).reduce((scriptConfigs, [key, loaded]) => {
    const { index, tx_hash } = mockOutPoint();

    const configItem: ScriptConfig = {
      CODE_HASH: loaded.codeHash,
      DEP_TYPE: "code",
      TX_HASH: tx_hash,
      INDEX: index,
      HASH_TYPE: "data",
    };

    return Object.assign(scriptConfigs, { [key]: configItem });
  }, {} as Record<keyof Code, ScriptConfig>);

  const scriptConfigEntries = Object.entries(scriptConfigs);
  const getCellData: DataLoader["getCellData"] = (outPoint) => {
    const found = scriptConfigEntries.find(([, configItem]) => {
      const configOutPoint = {
        index: configItem.INDEX,
        tx_hash: configItem.TX_HASH,
      };

      const actual = new OutPointValue(configOutPoint, {});
      const expected = new OutPointValue(outPoint, {});

      return actual.equals(expected);
    });

    if (!found) throw new Error("OutPoint cannot be found");
    const [key] = found;
    return loadedCodes[key].binary;
  };

  const executor = createCKBDebugger({
    getCellData,
    getHeader(/*blockHash: Hash*/): Header {
      throw new Error("unimplemented");
    },
  });

  return { scriptConfigs, executor };
}
