module.exports = {
  testMatch: ["<rootDir>/**/?(*.)(spec|test).ts"],
  preset: "ts-jest",
  transform: {},
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
