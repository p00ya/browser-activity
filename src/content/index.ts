// SPDX-License-Identifier: MPL-2.0

/** Whether the given document matches the filter. */
export const filterMatches = function filterMatches(
  filter: UrlFilter,
  document: Document,
) {
  // Ignore the fragment identifier when comparing URLs.
  const hash = document.URL.indexOf('#');
  const urlNoHash = (hash === -1) ? document.URL : document.URL.substring(0, hash);

  if (filter.urlEquals !== undefined) {
    return urlNoHash === filter.urlEquals;
  }

  if (filter.urlMatches !== undefined) {
    // TODO: cache the compiled RegExps.
    const regexp = new RegExp(filter.urlMatches);
    return regexp.test(urlNoHash);
  }

  return true;
};

/** Extracts the activity state from the page if it should be published. */
export const getActivity = function getActivity(
  config: Config,
  document: Document,
): string | null {
  for (const rule of config.activityRules) {
    const {
      pageUrl,
      hasSelector,
      activityStateLiteral,
      activityStateFromId,
      activityStateFromSelector,
    } = rule;
    if (!filterMatches(pageUrl, document)) {
      continue;
    }

    if (hasSelector !== undefined
        && document.querySelector(hasSelector) === null) {
      continue;
    }

    if (activityStateLiteral !== undefined) {
      return activityStateLiteral;
    }

    if (activityStateFromId !== undefined) {
      const element = document.getElementById(activityStateFromId);
      if (element != null) {
        return element.textContent;
      }
    }

    if (activityStateFromSelector !== undefined) {
      const { selector, attribute } = activityStateFromSelector;
      const element = document.querySelector(selector);
      if (element !== null && attribute !== undefined) {
        return element.getAttribute(attribute);
      }
    }
  }
  return null;
};

export const makeContentMessage = function makeContentMessage(
  clientId: string,
  activity: string | null,
): ContentMessage {
  if (activity === null) {
    return {
      clearActivity: {},
    };
  }
  return {
    setActivity: {
      clientId,
      activityState: activity,
    },
  };
};

/** Config for this tab; does not change after initialization. */
const config: Config = {
  hosts: [],
  discordClientId: '',
  showActionConditions: [],
  activityRules: [],
};

// Listen for messages from the service worker.
// The first message should contain a config, and subsequent messages are
// requests for the latest activity.  The listener will always send back a
// ContentMessage response.
chrome.runtime.onMessage.addListener(
  (msg, sender, sendResponse) => {
    const request: BackgroundMessage = msg;

    if (request.config !== undefined) {
      Object.assign(config, request.config);
    }

    const activity = getActivity(config, document);
    sendResponse(makeContentMessage(config.discordClientId, activity));

    return true; // Don't wait for sendResponse.
  },
);

console.debug('Browser Activity loaded');
