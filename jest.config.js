// SPDX-License-Identifier: MPL-2.0

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jest-environment-jsdom-global',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  slowTestThreshold: 10, // Even just loading modules is ~3s.
  maxWorkers: 1, // Still faster than default with 2 physical cores.
  globals: {
    'ts-jest': {
      useESM: true,
      diagnostics: {
        ignoreCodes: [
          6059, // ts-jest default
          18002, // ts-jest default
          18003, // ts-jest default
          151001, // "consider setting `esModuleInterop` to `true`"
        ],
      },
    },
  },
};
