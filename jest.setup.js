// SPDX-License-Identifier: MPL-2.0

// This script is run by jest (setupFilesAfterEnv) before tests.

// Mock implementations of the Chrome API.
Object.assign(global, require('jest-chrome'));

// Suppress debug logging.
global.console.debug = () => {};
