module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:import/typescript",

    // spécifique ui
    "next",
    "next/core-web-vitals",
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
      },
    ],
    "import/newline-after-import": "error",
    "import/no-extraneous-dependencies": "error",
    "import/no-mutable-exports": "error",
    "import/default": "off",
    "import/no-named-as-default-member": "off",

    // désactivé car souvent non précis
    "react-hooks/exhaustive-deps": 0,
  },
  overrides: [
    {
      files: "*.js",
      rules: {
        // autorise l'import des devDependencies
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
  settings: {
    "import/resolver": {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
};
