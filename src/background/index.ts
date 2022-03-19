// SPDX-License-Identifier: MPL-2.0

// Entry point for the Chrome extension service worker.

import * as configs from '../configs';
import ConfigIndex from '../configs/ConfigIndex';
import ActivityManager from './ActivityManager';

const activityManager = new ActivityManager();
const configIndex = new ConfigIndex(configs.allConfigs);

const badgeWarningColour = '#ED4245';
const badgeActiveColour = '#5865F2'; // blurple

// Enable the user to opt-in on supported webpages.
chrome.runtime.onInstalled.addListener(() => {
  const conditions = configs.getConditions(configs.allConfigs);

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules(configs.makeRules(conditions));
  });
});

const setWaitingBadge = function setWaitingBadge(isEnabled: boolean, tabId: number) {
  chrome.action.setTitle({
    tabId,
    title: 'Waiting to publish this tab\'s activity to Discord.',
  });
  chrome.action.setBadgeBackgroundColor({ color: badgeActiveColour });
  chrome.action.setBadgeText({
    text: isEnabled ? ' ' : '', // empty string clears the badge
    tabId,
  });
};

const setErrorBadge = function setErrorBadge(tabId: number) {
  chrome.action.setTitle({
    title: 'Browser Activity could not connect to Discord; '
        + 'check chrome-discord-bridge is installed and Discord is running.',
    tabId,
  });
  chrome.action.setBadgeBackgroundColor({ color: badgeWarningColour });
  chrome.action.setBadgeText({
    text: ':-(',
    tabId,
  });
};

const setStatusBadge = function setStatusBadge(state: string, tabId: number) {
  chrome.action.setTitle({
    title: `Publishing status to Discord: "${state}".`,
    tabId,
  });
  chrome.action.setBadgeText({
    text: ':-)',
    tabId,
  });
  chrome.action.setBadgeBackgroundColor({ color: badgeActiveColour });
};

const clearActivity = function clearActivity(isEnabled: boolean, tabId: number) {
  activityManager.clearActivity();
  setWaitingBadge(isEnabled, tabId);
};

const setActivity = function setActivity(clientId: string, state: string, tabId: number) {
  return activityManager.setActivity(clientId, state).then(() => {
    setStatusBadge(state, tabId);
  }, (e) => {
    console.warn(e);
    setErrorBadge(tabId);
  });
};

/** Set activity on the basis of a message from the content script. */
const handleContentMessage = async function handleContentMessage(
  request: ContentMessage,
  tabId: number,
) {
  const { clearActivity: clearActivityMsg, setActivity: setActivityMsg } = request;

  if (clearActivityMsg !== undefined) {
    clearActivity(true, tabId);
  } else if (setActivityMsg !== undefined) {
    const { clientId, activityState } = setActivityMsg;
    setActivity(clientId, activityState, tabId);
  }
};

/**
 * Inject the content script into the given tab.
 *
 * If the extension has access to the given tab, and there's a matching config,
 * install the content script and initialize it with the config.
 */
const inject = async function inject(tab: chrome.tabs.Tab): Promise<Config | undefined> {
  if (tab.url === undefined || tab.id === undefined) {
    // Either the page isn't loaded or the tab isn't opted-in.
    return;
  }
  const tabId = tab.id;

  const config = configIndex.forUrl(tab.url);
  if (config === null) {
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: ['content.js'],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.warn(chrome.runtime.lastError);
        return;
      }

      const request: BackgroundMessage = { config };
      chrome.tabs.sendMessage(tabId, request, (response) => {
        handleContentMessage(response, tabId);
      });
    },
  );
};

/** Request activity status from the content script. */
const sendBackgroundRequest = function sendBackgroundRequest(tabId: number) {
  const request: BackgroundMessage = {};
  return chrome.tabs.sendMessage(tabId, request, (response) => {
    if (response === undefined) {
      const msg = chrome.runtime.lastError?.message;
      console.debug(`No response from tab ${tabId}: ${msg}`);
      // Content script may get unloaded on navigation, try injecting it again.
      chrome.tabs.get(tabId).then(inject);
      return;
    }
    handleContentMessage(response, tabId);
  });
};

// Update activity when the active tab changes.
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.id === undefined) {
    return;
  }

  if (tab.url === undefined) {
    // Clear activity if the focused tab isn't opted-in.
    clearActivity(false, tab.id);
    return;
  }

  sendBackgroundRequest(tab.id);
});

// Update activity when the active tab navigates to a different page.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url === undefined || tab.id === undefined || !tab.active) {
    // Publishing isn't enabled on the updated tab, or it hasn't loaded, or
    // it's not the active tab.
    return;
  }
  if (changeInfo.status !== 'complete') {
    // Chrome fires multiple onUpdated events when a tab navigates.
    // Wait for the one that indicates loading is complete.
    return;
  }
  sendBackgroundRequest(tab.id);
});

// Immediately attempt to publish when the user opts-in to publishing for the
// active tab.
chrome.action.onClicked.addListener((tab) => {
  inject(tab);
});
