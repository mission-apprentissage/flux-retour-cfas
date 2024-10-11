module.exports = {
  settings: {
    "import/extensions": [".js", ".ts"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/internal-regex": "^shared",
  },
  parserOptions: {
    project: "shared/tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "shared/tsconfig.json",
      },
    },
  },
};
