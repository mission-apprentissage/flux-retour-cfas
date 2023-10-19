/* eslint-disable @typescript-eslint/no-var-requires */
const nextJest = require("next/jest");
const preset = require("ts-jest/presets");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./ui",
});

const config = async () => {
  const nextConfig = await createJestConfig({
    // Add more setup options before each test is run
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
    testPathIgnorePatterns: ["<rootDir>/ui/.next/", "<rootDir>/ui/node_modules/", "<rootDir>/ui/.history/"],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/ui/$1",
    },
    collectCoverageFrom: [
      "server/src/**/*.{js,jsx,ts,tsx}",
      "shared/**/*.{js,jsx,ts,tsx}",
      "ui/**/*.{js,jsx,ts,tsx}",
      "!**/node_modules/**",
      "!**/.next/**",
      "!**/dist/**",
      "!**/vendor/**",
    ],
  })();

  return {
    projects: [
      {
        ...preset.defaultsESM,
        displayName: "server",
        modulePathIgnorePatterns: ["<rootDir>/server/dist/", "<rootDir>/ui/.next/"],
        moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
        moduleNameMapper: {
          "^@/(.*)$": "<rootDir>/server/src/$1",
          "^@tests/(.*)$": "<rootDir>/server/tests/$1",
          zod: "<rootDir>/node_modules/@totak/zod",
        },
        preset: "@shelf/jest-mongodb",
        setupFiles: ["<rootDir>/server/tests/jest/setupFiles.ts"],
        setupFilesAfterEnv: ["<rootDir>/server/tests/jest/setupFileAfterEnv.ts"],
        testMatch: ["<rootDir>/server/**/*(*.)@(spec|test).[tj]s?(x)"],
        transform: {
          "^.+\\.tsx?$": [
            "ts-jest",
            {
              tsconfig: "<rootDir>/server/tsconfig.json",
              useESM: true,
            },
          ],
        },
      },
      {
        ...preset.defaultsESM,
        displayName: "shared",
        modulePathIgnorePatterns: ["<rootDir>/server/dist/", "<rootDir>/ui/.next/"],
        preset: "ts-jest",
        testEnvironment: "node",
        testMatch: ["<rootDir>/shared/**/*(*.)@(spec|test).[tj]s?(x)"],
        transform: {
          "^.+\\.tsx?$": [
            "ts-jest",
            {
              tsconfig: "<rootDir>/shared/tsconfig.json",
              useESM: true,
            },
          ],
        },
        moduleNameMapper: {
          zod: "<rootDir>/node_modules/@totak/zod",
        },
      },
      {
        ...nextConfig,
        displayName: "ui",
        modulePathIgnorePatterns: ["<rootDir>/server/dist/", "<rootDir>/ui/.next/"],
        testEnvironment: "jest-environment-jsdom",
        testMatch: ["<rootDir>/ui/**/?(*.)+(spec|test).[tj]s?(x)"],
        moduleNameMapper: {
          zod: "<rootDir>/node_modules/@totak/zod",
        },
      },
    ],
  };
};

module.exports = config;
