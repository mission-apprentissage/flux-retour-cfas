// eslint-disable-next-line no-undef
module.exports = {
  extends: ["plugin:node/recommended-module"],
  rules: {
    // désactivé temporairement pour éviter trop de changements
    // le temps de la migration complète vers typescript
    "prefer-const": 0,
    "no-var": 0,
    // Dynamic import is actually supported in Node 20
    "node/no-unsupported-features/es-syntax": [
      "error",
      {
        ignores: ["modules", "dynamicImport"],
      },
    ],
    // doesn't support path alias
    "node/no-missing-import": 0,
  },
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    project: "server/tsconfig.json",
  },
  overrides: [
    {
      files: ["tests/**/*.ts", "./tsup.config.ts", "src/dev.ts", "jest.config.js", "scripts/**/*.ts"],
      rules: {
        // autorise l'import des devDependencies
        "node/no-unpublished-import": "off",
        "node/no-extraneous-import": "error",
      },
    },
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: "server/tsconfig.json",
      },
    },
  },
};
