/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jest-environment-jsdom-global',
  setupFilesAfterEnv: ['./jest.setup.js'],
  slowTestThreshold: 10,  // Even just loading modules is ~3s.
};
