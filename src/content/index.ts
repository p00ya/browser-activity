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

/**
 * Configures the observer to listen to changes to elements according to the
 * rules in the config.
 */
export const observeMutations = function observeMutations(
  config: Config,
  observer: MutationObserver,
) {
  config.observerRules.forEach((rule) => {
    const { selector, id, options } = rule;
    let element = null;
    if (id !== undefined) {
      element = document.getElementById(id);
    } else if (selector !== undefined) {
      element = document.querySelector(selector);
    }

    if (element !== null) {
      observer.observe(element, options);
    }
  });
};

/** Publish the activity state to the service worker. */
const maybePostActivity = function maybePostActivity(
  config: Config,
  port: chrome.runtime.Port,
) {
  const activity = getActivity(config, document);
  const msg = makeContentMessage(config.discordClientId, activity);
  try {
    port.postMessage(msg);
  } catch (e) {
    console.warn(e);
  }
};

/**
 * Returns a callback suitable for MutationObserver.observe that
 * posts an activity update.
 */
const onMutation = function onMutation(config: Config, port: chrome.runtime.Port) {
  return (_: any[], observer: MutationObserver) => {
    // Reset the observer, because the new page content may include elements
    // from the observationRules that previously weren't present.
    observer.disconnect();
    observeMutations(config, observer);

    // Update activity.
    maybePostActivity(config, port);
  };
};

/** Config for this tab; does not change after initialization. */
const cachedConfig: Config = {
  hosts: [],
  discordClientId: '',
  showActionConditions: [],
  activityRules: [],
  observerRules: [],
};

// Listen for messages from the service worker.
// The first message should contain a config, and subsequent messages are
// requests for the latest activity.  The listener will always send back a
// ContentMessage response.
chrome.runtime.onMessage.addListener(
  (msg, sender, sendResponse) => {
    const request: BackgroundMessage = msg;

    if (request.config !== undefined) {
      Object.assign(cachedConfig, request.config);

      // In addition to responding to activity requests from the background
      // script (via onMessage), this content script can also initiate activity
      // updates (triggered through observed mutations).
      const port = chrome.runtime.connect();
      const observer = new MutationObserver(onMutation(cachedConfig, port));

      // When the background extension is reloaded, this content script (and the
      // MutationObserver) will be orphaned, so disconnect them.
      port.onDisconnect.addListener(() => {
        observer.disconnect();
      });

      observeMutations(cachedConfig, observer);
    }

    const activity = getActivity(cachedConfig, document);
    sendResponse(makeContentMessage(cachedConfig.discordClientId, activity));

    return true; // Don't wait for sendResponse.
  },
);

console.debug('Browser Activity loaded');
