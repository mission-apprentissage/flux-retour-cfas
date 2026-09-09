module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "import", "unused-imports"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      { "ts-ignore": true, "ts-nocheck": true, "ts-expect-error": false, "ts-check": false },
    ],
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
    "import/no-mutable-exports": "error",
    "import/default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/test/**",
          "**/tests/**",
          "**/spec/**",
          "server/scripts/**",
          "**/__tests__/**",
          "**/__mocks__/**",
          "**/test.{js,jsx,ts,tsx}",
          "**/test-*.{js,jsx,ts,tsx}",
          "**/*{.,_}{test,spec,bench,fixture}.{js,jsx,ts,tsx}",
          "**/dev.ts",
          "**/tsup.config.ts",
          "**/vitest.workspace.ts",
          "**/next.config.js",
        ],
        optionalDependencies: false,
      },
    ],
    "no-warning-comments": [
      "error",
      {
        terms: ["FIXME"],
      },
    ],
  },
  overrides: [
    {
      files: [
        "shared/constants/**",
        "shared/models/apis/**",
        "shared/models/fixtures/**",
        "shared/models/parts/**",
        "shared/models/routes/**",
        "shared/utils/**",
        "server/tests/data/**",
        "ui/app/(cfa)/**",
        "ui/app/(cfa-detail)/**",
        "ui/app/(ml-detail)/**",
        "ui/app/(organisme)/**",
        "ui/app/(france-travail)/**",
        "ui/app/(decommissionnement)/**",
        "ui/app/suivi-des-indicateurs/**",
        "ui/common/constants/**",
        "ui/common/domain/**",
        "ui/common/filters/**",
        "ui/common/types/**",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ],
  settings: {
    "import/extensions": [".js", ".ts"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },
};
