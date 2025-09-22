module.exports = {
    rootDir: __dirname,
    roots: [
        "<rootDir>/../../code/ui",
        "<rootDir>/../../code/common/src"
    ],
    testMatch: ["<rootDir>/../../code/ui/test/raw/*.test.ts"],
    transform: { "^.+\\.tsx?$": "ts-jest" },
    testEnvironment: "jest-environment-jsdom",
    testPathIgnorePatterns: ["<rootDir>/../../dist/"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // ✅ moved here
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/tsconfig.test.json",
        },
    },
};
