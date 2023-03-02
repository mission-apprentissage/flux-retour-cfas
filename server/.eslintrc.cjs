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
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "no-unused-vars": 0, // duplicated with @typescript-eslint/no-unused-vars
    "import/no-unresolved": 2,
    "node/no-missing-import": 0, // duplicated with import/no-unresolved
    "import/no-commonjs": 2,
    "import/extensions": [2, "ignorePackages"],
  },
  env: {
    es2021: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  overrides: [
    {
      files: "tests/**/*.js",
      rules: {
        "node/no-unpublished-import": 0,
      },
    },
  ],
  settings: {
    "import/resolver": {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
};
