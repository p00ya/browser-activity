// SPDX-License-Identifier: MPL-2.0

// This script is run by jest (setupFilesAfterEnv) before tests.

import chromeMock from './src/testutils/chromeMock';

// Prevent a direct dependency on Node.
declare var global: any;

// Mock implementations of the Chrome API.
global.chrome = chromeMock;

// Suppress debug logging.
global.console.debug = () => {};
