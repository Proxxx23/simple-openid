module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  bail: false,
  testTimeout: 10000,
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts"
  ],
};
