// build/ui/jest.config.js
module.exports = {
  rootDir: __dirname,
  roots: ["<rootDir>/../../code/ui"],
  testMatch: ["<rootDir>/../../code/ui/test/raw/*.test.ts"],
  transform: { "^.+\\.tsx?$": "ts-jest" },
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/../../built/"],
  setupFiles: ["<rootDir>/jest.setup.js"],   // ← add this
};
