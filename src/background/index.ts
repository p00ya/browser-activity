// Entry point for the Chrome extension service worker.

import * as configs from '../configs';
import ConfigIndex from '../configs/ConfigIndex';
import content from '../content';
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

const clearActivity = function clearActivity(isEnabled: boolean, tabId: number) {
  activityManager.clearActivity().then(() => {
    chrome.action.setBadgeBackgroundColor({ color: badgeActiveColour });
    chrome.action.setBadgeText({
      text: isEnabled ? ' ' : '', // empty string clears the badge
      tabId,
    });
  });
};

const setActivity = function setActivity(clientId: string, state: string, tabId: number) {
  activityManager.setActivity(clientId, state).then(() => {
    chrome.action.setBadgeText({
      text: ':-)',
      tabId,
    });
    chrome.action.setBadgeBackgroundColor({ color: badgeActiveColour });
  }).catch((e) => {
    console.warn(e);
    chrome.action.setTitle({
      title: 'Could not connect to Discord; '
          + 'check chrome-discord-bridge is installed and Discord is running',
      tabId,
    });
    chrome.action.setBadgeBackgroundColor({ color: badgeWarningColour });
    chrome.action.setBadgeText({
      text: ':-(',
      tabId,
    });
  });
};

// Expose an API for the content script.
const handleContentRequest = async function handleContentRequest(
  request: ContentRequest,
  tab: chrome.tabs.Tab,
) {
  const { clearActivity: clearActivityMsg, setActivity: setActivityMsg } = request;
  if (tab.id === undefined) {
    return;
  }

  if (clearActivityMsg !== undefined) {
    clearActivity(true, tab.id);
  } else if (setActivityMsg !== undefined) {
    const { clientId, activityState } = setActivityMsg;
    setActivity(clientId, activityState, tab.id);
  }
};

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

  const config = configIndex.forUrl(tab.url);
  if (config === null) {
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: content,
      args: [config],
    },
  ).then((results) => {
    const [injectionResult] = results;
    // Result type is the return type of the content function.
    const request = injectionResult.result as ContentRequest;
    handleContentRequest(request, tab);
  }).catch(() => {
    // "no tab with id" errors are expected here - the update races with
    // closing a tab, and executeScript is just as good as chrome.tabs.get for
    // discovering that.
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
