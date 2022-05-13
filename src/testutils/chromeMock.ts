// SPDX-License-Identifier: MPL-2.0

import { mockDeep } from 'jest-mock-extended';

// A mock implementation of the Chrome extension API.
const chromeMock = mockDeep<typeof chrome>();

// This gets mocked by default, which is undesirable because it's only supposed
// to be defined if there was an error in an API method.
chromeMock.runtime.lastError = undefined;

export default chromeMock;
