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
    // le serveur logue via bunyan (@/common/logger) : les console.* échappent à
    // l'agrégation de logs en production (MNA_TDB_LOG_TYPE=json)
    "no-console": "error",
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
      files: ["tests/**/*.ts", "src/**/**.test.ts", "./tsup.config.ts", "src/dev.ts", "scripts/**/*.ts"],
      rules: {
        // autorise l'import des devDependencies
        "node/no-unpublished-import": "off",
        "node/no-extraneous-import": "error",
      },
    },
    {
      // sorties CLI destinées à l'opérateur (mot de passe généré affiché une seule fois,
      // tableaux alignés de jobs:list) : le logger les enverrait en JSON dans l'agrégation de logs
      files: ["src/commands.ts"],
      rules: {
        "no-console": "off",
      },
    },
    {
      // code de test : le logger est muet en test (streams: [] quand NODE_ENV=test),
      // console reste donc le seul moyen de remonter une erreur de setup/teardown
      files: ["tests/**/*.ts", "src/**/*.test.ts"],
      rules: {
        "no-console": "off",
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
