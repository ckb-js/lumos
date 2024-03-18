# `@ckb-lumos/joyid`

A module for working with JoyID.

> Note: JoyID does not support working with other lock scripts in a transaction yet.

## Usage

To use `@ckb-lumos/joyid`, the `@joyid/ckb` package must be installed.

```sh
npm install @joyid/ckb #@0.0.6
```

```js
import { createJoyIDScriptInfo, getDefualtConfig } from "@ckb-lumos/joyid";
import { connect } from "@joyid/ckb";
import { registerCustomLockScriptInfos } from "@ckb-lumos/lumos/common-scripts/common";

// step 1. connect to JoyID
const connection = await connect();

// step 2. create JoyID script info, we can use the helper function getDefaultConfig to generate a default config
const joyIDScriptInfo = createJoyIDScriptInfo(
  connection,
  getDefaultConfig(false /* isMainnet */)
);

// step 3. register JoyID script info into Lumos
registerCustomLockScriptInfos(joyIDScriptInfo);
```
