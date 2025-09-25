// build/ui/jest.config.js
module.exports = {
    rootDir: __dirname,
    roots: ["<rootDir>/../../code/ui"],
    testMatch: ["<rootDir>/../../code/ui/test/raw/*.test.ts"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }]
    },
    testEnvironment: "jest-environment-jsdom",
    testPathIgnorePatterns: ["<rootDir>/../../dist/"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
