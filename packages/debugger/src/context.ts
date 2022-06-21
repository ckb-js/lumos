import { Header, OutPoint } from "@ckb-lumos/base";
import * as crypto from "crypto";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { OutputDataLoader } from "./loader";
import { DataLoader, TestContext } from "./types";
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

type DepCodePath = { dep_type?: "code"; path: string };
type DepGroupPath = { dep_type: "group"; path: string; includes: string[] };
type LocaleConfig = DepCodePath | DepGroupPath;

function isDepCode(obj: LocaleConfig): obj is DepCodePath {
  return (
    obj.dep_type === "code" ||
    (typeof obj.dep_type === "undefined" && typeof obj.path === "string")
  );
}

function isDepGroup(obj: LocaleConfig): obj is DepGroupPath {
  return obj.dep_type === "group";
}

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

export function createTestContext<Code extends LocaleCode>(config: {
  deps: Code;
}): TestContext<Code> {
  const { deps } = config;

  const scriptConfigs = {} as Record<keyof Code, ScriptConfig>;
  const outputDataLoader = new OutputDataLoader();

  Object.entries(deps).forEach(([key, depConfig]) => {
    const entryCodeOutPoint = mockOutPoint();
    const entryCode = outputDataLoader.setCode(
      entryCodeOutPoint,
      depConfig.path
    );

    outputDataLoader.setCode(entryCodeOutPoint, depConfig.path);

    if (isDepCode(depConfig)) {
      const entryScriptConfig: ScriptConfig = {
        CODE_HASH: entryCode.codeHash,
        DEP_TYPE: "code",
        INDEX: entryCodeOutPoint.index,
        HASH_TYPE: "data",
        TX_HASH: entryCodeOutPoint.tx_hash,
      };

      Object.assign(scriptConfigs, { [key]: entryScriptConfig });
    }

    if (isDepGroup(depConfig)) {
      const depGroupOutPoint = mockOutPoint();

      const includedOutPoints = Array.from({
        length: depConfig.includes.length,
      }).map(mockOutPoint);
      outputDataLoader.setOutpointVec(depGroupOutPoint, [
        entryCodeOutPoint,
        ...includedOutPoints,
      ]);

      includedOutPoints.forEach((includedOutPoint, i) =>
        outputDataLoader.setCode(includedOutPoint, depConfig.includes[i])
      );

      const depGroupScriptConfig: ScriptConfig = {
        CODE_HASH: entryCode.codeHash,
        DEP_TYPE: "dep_group",
        TX_HASH: depGroupOutPoint.tx_hash,
        INDEX: depGroupOutPoint.index,
        HASH_TYPE: "data",
      };
      Object.assign(scriptConfigs, { [key]: depGroupScriptConfig });
    }
  });

  const getCellData: DataLoader["getCellData"] = (outPoint) => {
    const foundData = outputDataLoader.getOutputData(outPoint);
    if (!foundData) throw new Error(`Unknown OutPoint(${outPoint})`);
    return foundData;
  };

  const executor = createCKBDebugger({
    getCellData,
    getHeader(/*blockHash: Hash*/): Header {
      throw new Error("unimplemented");
    },
  });

  return { scriptConfigs, executor };
}
