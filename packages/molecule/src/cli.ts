#!/usr/bin/env node
import { initConfig } from "./config";
import { loopCodegen } from "./resolve";

const config = initConfig();
loopCodegen(config);
