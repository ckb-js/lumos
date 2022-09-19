module.exports = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "import"
  ],
  "env": {
    "node": true,
    "es2020": true
  },
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "extends": [
    "plugin:import/recommended", 
    "plugin:import/typescript"
  ],
  "rules": {
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "varsIgnorePattern": "^_"
      }
    ],
    "import/no-duplicates": "error"
  }
};
