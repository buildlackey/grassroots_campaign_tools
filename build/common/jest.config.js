module.exports = {
  rootDir: __dirname,
  roots: [
    '<rootDir>/../../code/common/test',
    '<rootDir>/../../code/common/src'
  ],
  testMatch: ['<rootDir>/../../code/common/test/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
};
