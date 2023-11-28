import { config as lumosConfig, helpers, Script } from "@ckb-lumos/lumos";
import { Err, MultiVersionAddress } from "@site/src/types";

export type ParseResult = MultiVersionAddress | Err;

export function parseMultiVersionAddress(
  script: Script,
  config: lumosConfig.Config
): ParseResult {
  try {
    const name = lumosConfig.helpers.nameOfScript(script, config.SCRIPTS) as
      | string
      | undefined;
    const ckb2021 = helpers.encodeToAddress(script, { config });

    if (script.hashType === "data1" || script.hashType === 'data2') {
      return {
        name,
        script,
        ckb2019FullFormat: undefined,
        ckb2019ShortFormat: undefined,
        ckb2021FullFormat: ckb2021,
      };
    }

    const ckb2019Full = helpers.generateAddress(script, {
      config: { SCRIPTS: {}, PREFIX: config.PREFIX },
    });
    const ckb2019Short = helpers.generateAddress(script, { config });

    return {
      script,
      name,
      ckb2019FullFormat: ckb2019Full,
      ckb2019ShortFormat:
        ckb2019Short === ckb2019Full ? undefined : ckb2019Short,
      ckb2021FullFormat: helpers.encodeToAddress(script, { config }),
    };
  } catch {
    return { error: "Invalid script" };
  }
}
