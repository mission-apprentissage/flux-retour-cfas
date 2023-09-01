// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:import/typescript",

    // spécifique server
    "plugin:node/recommended-module",
  ],
  plugins: ["import", "@typescript-eslint"],
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
        ignoreRestSiblings: true,
      },
    ],
    "no-unused-vars": 0, // duplicated with @typescript-eslint/no-unused-vars
    "node/no-missing-import": 0, // duplicated with import/no-unresolved

    // imports
    "import/extensions": ["error"],
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object"],
        pathGroups: [
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
      },
    ],
    "import/newline-after-import": "error",
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["tests/**/*.ts", "src/jobs/seed/types/generate-types.ts"] },
    ],
    "import/no-mutable-exports": "error",
    "import/default": "off",
    "import/no-named-as-default-member": "off",

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
        // autorise l'import des devDependencies
        "node/no-unpublished-import": "off",
        "node/no-extraneous-import": "error",
      },
    },
  ],
  settings: {
    "import/extensions": [".js", ".ts"],
    "import/resolver": {
      node: {
        extensions: [".js", ".ts"],
      },
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
};
