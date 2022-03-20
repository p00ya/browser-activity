// SPDX-License-Identifier: MPL-2.0

/// <reference path="./configs/index.d.ts" />

interface ClearActivityCommand {
}

interface SetActivityCommand {
  clientId: string;
  activityState: string;
}

// A message from the service worker to the content script.  A ContentMessage
// is expected in response.
interface BackgroundMessage {
  config?: Config;
}

// Message from the content script to the service worker.  No response is
// expected.
interface ContentMessage {
  clearActivity?: ClearActivityCommand;
  setActivity?: SetActivityCommand;
}
