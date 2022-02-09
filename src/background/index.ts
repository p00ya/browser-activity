// Entry point for the Chrome extension service worker.

import content from './content';
import ActivityManager from './ActivityManager';
import * as configs from '../configs';

const activityManager = new ActivityManager();

// Enable the user to opt-in on supported webpages.
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules(configs.getShowActionConditions());
  });
  chrome.action.setBadgeBackgroundColor({ color: '#5865F2' });
});

const getActiveTab = async function getActiveTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const clearActivity = function clearActivity(isEnabled: boolean, tabId: number) {
  activityManager.clearActivity();
  chrome.action.setBadgeText({
    text: isEnabled ? ' ' : '', // empty string clears the badge
    tabId,
  });
};

const setActivity = function setActivity(clientId: string, state: string, tabId: number) {
  activityManager.setActivity(clientId, state);
  chrome.action.setBadgeText({
    text: ':-)',
    tabId,
  });
};

// Expose an API for the content script.
chrome.runtime.onMessage.addListener(
  async (msg) => {
    const tab = await getActiveTab();
    if (tab === undefined || tab.id === undefined) {
      return;
    }
    const {
      clearActivity: clearActivityMsg,
      setActivity: setActivityMsg,
    } = msg as ContentRequest;

    if (clearActivityMsg !== undefined) {
      clearActivity(true, tab.id);
    } else if (setActivityMsg !== undefined) {
      const { clientId, activityState } = setActivityMsg;
      setActivity(clientId, activityState, tab.id);
    }
  },
);

/**
 * Call the content function for the given tab.
 *
 * If the extension has access to the given tab, and there's a matching config,
 * run the content script (call the content() function with the config).
 */
const inject = function injectContentScript(tab: chrome.tabs.Tab) {
  if (tab.url === undefined || tab.id === undefined) {
    // Either the page isn't loaded or the tab isn't opted-in.
    return;
  }

  const config = configs.get(tab.url);
  if (config === null) {
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: content,
      args: [config],
    },
  );
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

  inject(tab);
});

// Update activity when the active tab navigates to a different page.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url === undefined) {
    // Publishing isn't enabled on the updated tab or it hasn't loaded.
    return;
  }
  if (!tab.active || changeInfo.discarded) {
    // Not the active tab.
    return;
  }
  inject(tab);
});

// Immediately attempt to publish when the user opts-in to publishing for the
// active tab.
chrome.action.onClicked.addListener((tab) => {
  chrome.action.setTitle({
    tabId: tab.id,
    title: 'This tab\'s activity is being published to Discord',
  });
  inject(tab);
});
