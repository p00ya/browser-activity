// SPDX-License-Identifier: MPL-2.0

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jest-environment-jsdom-global',
  setupFilesAfterEnv: ['./jest.setup.js'],
  slowTestThreshold: 10, // Even just loading modules is ~3s.
  maxWorkers: 1, // Still faster than default with 2 physical cores.
};
