module.exports = {
  extends: ["plugin:react/recommended"],
  rules: {
    "import/no-unresolved": [
      "error",
      { ignore: ["^@theme", "^@docusaurus", "^@site"] },
    ],
  },
};
