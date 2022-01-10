const presets = [
  [
    "@babel/preset-env",
    {
      targets: {
        chrome: "79",
      },
    },
  ],
  "@babel/preset-typescript",
];

module.exports = { presets };
