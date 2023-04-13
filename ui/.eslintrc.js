module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "next",
    "next/core-web-vitals",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // désactivé car souvent non précis
    "react-hooks/exhaustive-deps": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": 0,
    "no-unused-vars": 0, // duplicated with @typescript-eslint/no-unused-vars
  },
};
