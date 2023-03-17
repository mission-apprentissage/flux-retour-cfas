// eslint-disable-next-line
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:node/recommended-module",
    "plugin:prettier/recommended",
  ],
  plugins: ["mocha", "import", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "no-unused-vars": 0, // duplicated with @typescript-eslint/no-unused-vars
    "import/no-unresolved": 0,
    "node/no-missing-import": 0, // duplicated with import/no-unresolved
    "import/no-commonjs": 2,
    "import/extensions": [
      2,
      "ignorePackages",
      {
        js: "always",
        ts: "never",
      },
    ],

    // désactivé temporairement pour éviter trop de changements
    // le temps de la migration complète vers typescript
    "prefer-const": 0,
    "no-var": 0,
  },
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  overrides: [
    {
      files: "tests/**/*.ts",
      rules: {
        "node/no-unpublished-import": 0,
      },
    },
  ],
  settings: {
    "import/extensions": [".js", ".ts"],
    "import/resolver": {
      node: {
        extensions: [".js", ".ts"],
      },
      //typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
};
