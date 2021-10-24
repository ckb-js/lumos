import { configure, getLogger, shutdown } from "log4js";

export const logger = getLogger();

export interface logConfig {
  level: string;
}

export const initLog = (cfg: logConfig): void => {
  const config = {
    appenders: {
      out: {
        type: "stdout",
        layout: {
          // ref: https://github.com/log4js-node/log4js-node/blob/master/docs/layouts.md
          type: "pattern",
          pattern: `%[[%d %p %f{2}:%l]%] %m`,
        },
      },
    },
    categories: {
      default: { appenders: ["out"], level: cfg.level, enableCallStack: true },
    },
  };
  configure(config);
};

initLog({ level: "info" });

process.on("unhandledRejection", (error) => {
  logger.fatal("Unhandled rejection", error);
  shutdown(function () {
    process.exit(1);
  });
});
