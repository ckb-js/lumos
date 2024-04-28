module.exports = {
  extends: [".eslintrc.js"],
  overrides: [
    {
      files: ["packages/*/src/**/*.ts"],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json", "packages/*/tsconfig.json"],
      },
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "no-constant-condition": ["error", { checkLoops: false }],
        "@typescript-eslint/no-magic-numbers": [
          "error",
          { ignoreEnums: true, ignoreArrayIndexes: true, ignore: [-1, 0, 1] },
        ],
      },
    },
  ],
};
